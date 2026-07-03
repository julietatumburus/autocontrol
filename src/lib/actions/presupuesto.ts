"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notificarCliente } from "@/lib/notificaciones";
import { formatMoney } from "@/lib/utils";

type Result = { error?: string; ok?: boolean };

/** Verifica que el usuario sea staff (o super admin) del taller. */
async function autorizarStaff(tallerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role === "SUPER_ADMIN") return session.user;
  const member = await prisma.tallerMember.findUnique({
    where: { userId_tallerId: { userId: session.user.id, tallerId } },
  });
  if (!member) throw new Error("Sin permiso sobre este taller");
  return session.user;
}

/** Usuario del taller a notificar (creador de la orden, o un admin). */
async function tallerContactoUserId(
  tallerId: string,
  creadoPorId: string | null,
): Promise<string | null> {
  if (creadoPorId) return creadoPorId;
  const admin = await prisma.tallerMember.findFirst({
    where: { tallerId, role: "ADMIN" },
    orderBy: { creadoEn: "asc" },
  });
  return admin?.userId ?? null;
}

const enviarSchema = z.object({
  ordenId: z.string().min(1),
  nota: z.string().optional(),
});

/** El taller envía el presupuesto (snapshot de ítems) al cliente para aprobar. */
export async function enviarPresupuesto(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = enviarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { ordenId, nota } = parsed.data;

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: ordenId },
    include: { items: true, vehiculo: true, cliente: true, taller: true },
  });
  if (!orden) return { error: "Orden no encontrada" };
  const staff = await autorizarStaff(orden.tallerId);

  if (orden.items.length === 0) {
    return { error: "Cargá al menos un ítem antes de enviar el presupuesto." };
  }
  if (orden.estado === "PAGADA" || orden.estado === "ENTREGADA") {
    return { error: "La orden ya está cerrada." };
  }

  // No permitir dos presupuestos pendientes a la vez
  const pendiente = await prisma.presupuesto.findFirst({
    where: { ordenId, estado: "ENVIADO" },
  });
  if (pendiente) {
    return { error: "Ya hay un presupuesto pendiente de respuesta del cliente." };
  }

  await prisma.$transaction(async (tx) => {
    const count = await tx.presupuesto.count();
    const numero = `PR-${String(count + 1).padStart(4, "0")}`;

    await tx.presupuesto.create({
      data: {
        numero,
        ordenId,
        total: orden.total,
        nota: nota || null,
        clienteNombre: orden.cliente.nombre,
        tallerNombre: orden.taller.nombre,
        enviadoPorId: staff.id,
        detalle: {
          vehiculo: `${orden.vehiculo.marca} ${orden.vehiculo.modelo} (${orden.vehiculo.patente})`,
          items: orden.items.map((it) => ({
            nombre: it.nombre,
            tipo: it.tipo,
            cantidad: it.cantidad.toString(),
            precioUnitario: it.precioUnitario.toString(),
            subtotal: it.cantidad.mul(it.precioUnitario).toString(),
          })),
          total: orden.total.toString(),
        },
      },
    });
  });

  await notificarCliente({
    userId: orden.clienteId,
    ordenId,
    tipo: "PRESUPUESTO_ENVIADO",
    titulo: "Tenés un presupuesto para aprobar",
    mensaje: `${orden.taller.nombre} te envió el presupuesto de tu ${orden.vehiculo.marca} ${orden.vehiculo.modelo} por ${formatMoney(orden.total)}. Ingresá a Autocontrol para aprobarlo o rechazarlo.`,
  });

  revalidatePath(`/panel/ordenes/${ordenId}`);
  revalidatePath(`/mi-cuenta/ordenes/${ordenId}`);
  revalidatePath("/mi-cuenta");
  return { ok: true };
}

/** El cliente aprueba o rechaza un presupuesto. Al aprobar queda como contrato. */
export async function responderPresupuesto(
  presupuestoId: string,
  decision: "APROBAR" | "RECHAZAR",
  motivo?: string,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const pres = await prisma.presupuesto.findUnique({
    where: { id: presupuestoId },
    include: { orden: { include: { vehiculo: true, taller: true } } },
  });
  if (!pres) return { error: "Presupuesto no encontrado" };

  // Solo el cliente dueño de la orden puede responder
  if (pres.orden.clienteId !== session.user.id) {
    return { error: "No tenés permiso para responder este presupuesto." };
  }
  if (pres.estado !== "ENVIADO") {
    return { error: "Este presupuesto ya fue respondido." };
  }

  const aprobado = decision === "APROBAR";

  await prisma.presupuesto.update({
    where: { id: presupuestoId },
    data: {
      estado: aprobado ? "APROBADO" : "RECHAZADO",
      respondidoEn: new Date(),
      motivoRechazo: aprobado ? null : motivo || null,
      // Firma del cliente al momento de responder
      clienteNombre: session.user.nombre,
    },
  });

  const contactoId = await tallerContactoUserId(
    pres.orden.tallerId,
    pres.orden.creadoPorId,
  );
  if (contactoId) {
    await notificarCliente({
      userId: contactoId,
      ordenId: pres.ordenId,
      tipo: aprobado ? "PRESUPUESTO_APROBADO" : "PRESUPUESTO_RECHAZADO",
      titulo: aprobado
        ? `Presupuesto ${pres.numero} APROBADO`
        : `Presupuesto ${pres.numero} rechazado`,
      mensaje: aprobado
        ? `${session.user.nombre} aprobó el presupuesto de su ${pres.orden.vehiculo.marca} ${pres.orden.vehiculo.modelo}. Ya podés continuar con la reparación.`
        : `${session.user.nombre} rechazó el presupuesto de su ${pres.orden.vehiculo.marca} ${pres.orden.vehiculo.modelo}.${motivo ? ` Motivo: ${motivo}` : ""}`,
    });
  }

  revalidatePath(`/panel/ordenes/${pres.ordenId}`);
  revalidatePath(`/mi-cuenta/ordenes/${pres.ordenId}`);
  revalidatePath("/mi-cuenta");
  return { ok: true };
}
