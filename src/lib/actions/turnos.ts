"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { avisarTurno } from "@/lib/turnos-notif";
import {
  fechaHoraInstant,
  slotsDisponibles,
  weekdayDe,
} from "@/lib/agenda";

type Result = { error?: string; ok?: boolean };

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

  // El slot debe seguir libre
  const ocupado = await prisma.turno.findFirst({
    where: {
      tallerId: d.tallerId,
      fechaHora: instante,
      estado: { not: "CANCELADO" },
    },
    select: { id: true },
  });
  if (ocupado) return { error: "Ese horario ya fue tomado, elegí otro." };

  const turno = await prisma.turno.create({
    data: {
      tallerId: d.tallerId,
      clienteId: session?.user?.id ?? null,
      tipo: d.tipo,
      fechaHora: instante,
      duracionMin: taller.agendaDuracionMin,
      nombre: d.nombre,
      email: d.email.toLowerCase(),
      telefono: d.telefono || null,
      vehiculo: d.vehiculo || null,
      motivo: d.motivo || null,
    },
  });

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
  await prisma.turno.update({ where: { id: turnoId }, data: { estado } });
  revalidatePath("/panel/agenda");
  revalidatePath("/mi-cuenta/turnos");
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
    data: { estado: "CANCELADO" },
  });
  revalidatePath("/mi-cuenta/turnos");
  revalidatePath("/panel/agenda");
  return { ok: true };
}
