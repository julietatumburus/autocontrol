"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notificarCliente } from "@/lib/notificaciones";

type Result = { error?: string; ok?: boolean };

const schema = z.object({
  ordenId: z.string().min(1),
  cuerpo: z.string().trim().min(1, "Escribí un mensaje").max(2000),
});

/** Envía un mensaje en el hilo de una orden (taller ↔ cliente). */
export async function enviarMensaje(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { ordenId, cuerpo } = parsed.data;

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: ordenId },
    include: { vehiculo: true },
  });
  if (!orden) return { error: "Orden no encontrada" };

  // ¿Quién es el que escribe? Cliente dueño o staff del taller (o super admin).
  const esCliente = orden.clienteId === session.user.id;
  let esStaff = session.user.role === "SUPER_ADMIN";
  if (!esStaff) {
    const member = await prisma.tallerMember.findUnique({
      where: {
        userId_tallerId: {
          userId: session.user.id,
          tallerId: orden.tallerId,
        },
      },
    });
    esStaff = !!member;
  }
  if (!esCliente && !esStaff) {
    return { error: "No tenés acceso a esta orden." };
  }

  await prisma.mensaje.create({
    data: { ordenId, autorId: session.user.id, cuerpo },
  });

  // Notificar a la otra parte
  if (esCliente) {
    // avisar al taller (creador de la orden o un admin)
    let destinoId = orden.creadoPorId;
    if (!destinoId) {
      const admin = await prisma.tallerMember.findFirst({
        where: { tallerId: orden.tallerId, role: "ADMIN" },
        orderBy: { creadoEn: "asc" },
      });
      destinoId = admin?.userId ?? null;
    }
    if (destinoId) {
      await notificarCliente({
        userId: destinoId,
        ordenId,
        tipo: "MENSAJE_NUEVO",
        titulo: `Nuevo mensaje en la orden #${orden.numero}`,
        mensaje: `${session.user.nombre} escribió sobre el ${orden.vehiculo.marca} ${orden.vehiculo.modelo}: "${cuerpo.slice(0, 120)}"`,
      });
    }
  } else {
    // staff → avisar al cliente
    await notificarCliente({
      userId: orden.clienteId,
      ordenId,
      tipo: "MENSAJE_NUEVO",
      titulo: `Nuevo mensaje del taller`,
      mensaje: `Tenés un mensaje sobre tu ${orden.vehiculo.marca} ${orden.vehiculo.modelo}: "${cuerpo.slice(0, 120)}"`,
    });
  }

  revalidatePath(`/panel/ordenes/${ordenId}`);
  revalidatePath(`/mi-cuenta/ordenes/${ordenId}`);
  return { ok: true };
}
