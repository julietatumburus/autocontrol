"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { avisarTurno } from "@/lib/turnos-notif";
import { consumir, mensajeEspera } from "@/lib/rate-limit";
import { ipDelCliente } from "@/lib/ip";
import {
  fechaHoraInstant,
  slotsDisponibles,
  weekdayDe,
} from "@/lib/agenda";

type Result = { error?: string; ok?: boolean };

/**
 * Clave del horario mientras el turno lo ocupa. La columna `slotKey` es UNIQUE:
 * si dos personas eligen el mismo horario a la vez, la base rechaza la segunda
 * en vez de aceptar las dos (antes se consultaba y despues se insertaba, con
 * una ventana en el medio donde entraban ambas).
 */
function slotKeyDe(tallerId: string, instante: Date): string {
  return `${tallerId}|${instante.toISOString()}`;
}

const crearSchema = z.object({
  tallerId: z.string().min(1),
  tipo: z.enum(["PRESUPUESTO", "VISITA"]),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí una fecha"),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Elegí un horario"),
  nombre: z.string().trim().min(2, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  vehiculo: z.string().optional(),
  motivo: z.string().optional(),
});

/** Reserva un turno (cliente registrado o no registrado con su email). */
export async function crearTurno(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = crearSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;
  const session = await auth();

  // Sin limite, un bot puede reservar toda la agenda de un taller con datos
  // inventados: el turno no exige cuenta ni verifica el email.
  const porIp = consumir(`turno:ip:${await ipDelCliente()}`, 5, 60 * 60_000);
  if (!porIp.permitido) return { error: mensajeEspera(porIp) };
  const porEmail = consumir(
    `turno:email:${d.email.toLowerCase()}`,
    3,
    60 * 60_000,
  );
  if (!porEmail.permitido) return { error: mensajeEspera(porEmail) };

  const taller = await prisma.taller.findUnique({ where: { id: d.tallerId } });
  if (!taller || taller.estado !== "ACTIVO" || !taller.agendaActiva) {
    return { error: "Este taller no está tomando turnos." };
  }
  if (!taller.agendaDias.includes(weekdayDe(d.fecha))) {
    return { error: "Ese día el taller no atiende." };
  }

  const instante = fechaHoraInstant(d.fecha, d.hora);
  if (instante.getTime() <= Date.now()) {
    return { error: "Elegí un horario futuro." };
  }

  // El horario debe pertenecer a la grilla del taller
  const slots = slotsDisponibles(taller, d.fecha, new Set());
  if (!slots.includes(d.hora)) {
    return { error: "Horario fuera del rango de atención." };
  }

  // El slot debe seguir libre. La verificación real la hace el índice único
  // sobre `slotKey`; esto es solo para dar un mensaje lindo en el caso común.
  let turno;
  try {
    turno = await prisma.turno.create({
      data: {
        tallerId: d.tallerId,
        clienteId: session?.user?.id ?? null,
        tipo: d.tipo,
        fechaHora: instante,
        slotKey: slotKeyDe(d.tallerId, instante),
        duracionMin: taller.agendaDuracionMin,
        nombre: d.nombre,
        email: d.email.toLowerCase(),
        telefono: d.telefono || null,
        vehiculo: d.vehiculo || null,
        motivo: d.motivo || null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "Ese horario ya fue tomado, elegí otro." };
    }
    throw err;
  }

  await avisarTurno(turno.id, "alta");

  revalidatePath(`/talleres/${taller.slug}/turno`);
  revalidatePath("/panel/agenda");
  revalidatePath("/mi-cuenta/turnos");
  return { ok: true };
}

/** Verifica que el usuario sea staff del taller dueño del turno. */
async function autorizarStaffTurno(turnoId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const turno = await prisma.turno.findUnique({ where: { id: turnoId } });
  if (!turno) throw new Error("Turno no encontrado");
  if (session.user.role === "SUPER_ADMIN") return turno;
  const member = await prisma.tallerMember.findUnique({
    where: { userId_tallerId: { userId: session.user.id, tallerId: turno.tallerId } },
  });
  if (!member) throw new Error("Sin permiso");
  return turno;
}

export async function confirmarTurno(turnoId: string): Promise<Result> {
  await autorizarStaffTurno(turnoId);
  await prisma.turno.update({
    where: { id: turnoId },
    data: { estado: "CONFIRMADO" },
  });
  revalidatePath("/panel/agenda");
  revalidatePath("/mi-cuenta/turnos");
  return { ok: true };
}

export async function cambiarEstadoTurno(
  turnoId: string,
  estado: "CONFIRMADO" | "CANCELADO" | "COMPLETADO",
): Promise<Result> {
  await autorizarStaffTurno(turnoId);
  await prisma.turno.update({
    where: { id: turnoId },
    data: {
      estado,
      // Al cancelar se libera el horario: `slotKey` en NULL deja de ocupar
      // el índice único y alguien más puede reservarlo.
      ...(estado === "CANCELADO" ? { slotKey: null } : {}),
    },
  });
  revalidatePath("/panel/agenda");
  revalidatePath("/mi-cuenta/turnos");
  return { ok: true };
}

/**
 * El taller bloquea un horario (o todo el día) como "ocupado", para reservas
 * que recibió por fuera de Autocontrol. Esos slots dejan de estar disponibles.
 */
export async function marcarOcupado(
  tallerId: string,
  fecha: string,
  hora: string | null, // null = todo el día
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (session.user.role !== "SUPER_ADMIN") {
    const member = await prisma.tallerMember.findUnique({
      where: { userId_tallerId: { userId: session.user.id, tallerId } },
    });
    if (!member) return { error: "Sin permiso" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha inválida" };

  const taller = await prisma.taller.findUnique({ where: { id: tallerId } });
  if (!taller) return { error: "Taller no encontrado" };

  let horas: string[];
  if (hora) {
    if (!/^\d{2}:\d{2}$/.test(hora)) return { error: "Horario inválido" };
    horas = [hora];
  } else {
    horas = slotsDisponibles(taller, fecha, new Set());
    if (horas.length === 0) {
      return { error: "No hay horarios para bloquear ese día." };
    }
  }

  const instantes = horas.map((h) => fechaHoraInstant(fecha, h));
  const existentes = await prisma.turno.findMany({
    where: {
      tallerId,
      estado: { not: "CANCELADO" },
      fechaHora: { in: instantes },
    },
    select: { fechaHora: true },
  });
  const yaOcupadas = new Set(existentes.map((t) => t.fechaHora.toISOString()));

  const data = instantes
    .filter((inst) => !yaOcupadas.has(inst.toISOString()))
    .map((inst) => ({
      tallerId,
      tipo: "OCUPADO" as const,
      estado: "CONFIRMADO" as const,
      fechaHora: inst,
      slotKey: slotKeyDe(tallerId, inst),
      duracionMin: taller.agendaDuracionMin,
      nombre: "Ocupado",
      email: "ocupado@interno",
    }));

  if (data.length === 0) return { error: "Ese horario ya estaba ocupado." };
  // `skipDuplicates`: si alguien reservó un horario mientras se armaba la
  // lista, se bloquean los demás en vez de fallar todo el pedido.
  await prisma.turno.createMany({ data, skipDuplicates: true });

  revalidatePath("/panel/agenda");
  revalidatePath(`/talleres/${taller.slug}/turno`);
  return { ok: true };
}

/** Libera (elimina) un bloqueo "ocupado". */
export async function liberarBloqueo(turnoId: string): Promise<Result> {
  const turno = await autorizarStaffTurno(turnoId);
  if (turno.tipo !== "OCUPADO") return { error: "Ese turno no es un bloqueo." };
  await prisma.turno.delete({ where: { id: turnoId } });
  revalidatePath("/panel/agenda");
  return { ok: true };
}

/** El cliente registrado cancela su propio turno. */
export async function cancelarMiTurno(turnoId: string): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  const turno = await prisma.turno.findUnique({ where: { id: turnoId } });
  if (!turno || turno.clienteId !== session.user.id) {
    return { error: "No podés cancelar este turno." };
  }
  await prisma.turno.update({
    where: { id: turnoId },
    data: { estado: "CANCELADO", slotKey: null },
  });
  revalidatePath("/mi-cuenta/turnos");
  revalidatePath("/panel/agenda");
  return { ok: true };
}
