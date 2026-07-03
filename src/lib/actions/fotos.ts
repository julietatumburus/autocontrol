"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notificarCliente } from "@/lib/notificaciones";

type Result = { error?: string; ok?: boolean };

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB por foto

/** Verifica que el usuario sea staff (o super admin) del taller. */
async function autorizarStaff(tallerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role === "SUPER_ADMIN") return;
  const member = await prisma.tallerMember.findUnique({
    where: { userId_tallerId: { userId: session.user.id, tallerId } },
  });
  if (!member) throw new Error("Sin permiso sobre este taller");
}

/** El taller sube una o varias fotos del avance de una orden. */
export async function subirFotos(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const ordenId = String(formData.get("ordenId") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const etapaElegida = String(formData.get("etapaNombre") ?? "").trim();
  if (!ordenId) return { error: "Orden inválida" };

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: ordenId },
    include: { etapaActual: true, vehiculo: true },
  });
  if (!orden) return { error: "Orden no encontrada" };
  await autorizarStaff(orden.tallerId);

  // Etapa a la que se asignan las fotos (la elegida, o la actual por defecto)
  const etapaNombre = etapaElegida || orden.etapaActual?.nombre || null;

  const files = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { error: "Elegí al menos una foto" };

  const data: { ordenId: string; url: string; descripcion: string | null; etapaNombre: string | null }[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { error: "Todos los archivos deben ser imágenes" };
    }
    if (file.size > MAX_BYTES) {
      return { error: `Cada foto no puede superar 4 MB (“${file.name}”)` };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    data.push({
      ordenId,
      url: `data:${file.type};base64,${buffer.toString("base64")}`,
      descripcion: descripcion || null,
      etapaNombre,
    });
  }

  await prisma.ordenFoto.createMany({ data });

  await notificarCliente({
    userId: orden.clienteId,
    ordenId,
    tipo: "ETAPA_ACTUALIZADA",
    titulo: "Nuevas fotos del avance",
    mensaje: `${orden.vehiculo.marca} ${orden.vehiculo.modelo}: el taller subió ${files.length} foto${files.length > 1 ? "s" : ""} del avance. Mirá cómo va tu reparación en Autocontrol.`,
  });

  revalidatePath(`/panel/ordenes/${ordenId}`);
  revalidatePath(`/mi-cuenta/ordenes/${ordenId}`);
  return { ok: true };
}

/** Elimina una foto (solo staff del taller). */
export async function eliminarFoto(fotoId: string): Promise<Result> {
  const foto = await prisma.ordenFoto.findUnique({
    where: { id: fotoId },
    include: { orden: { select: { tallerId: true, id: true } } },
  });
  if (!foto) return { error: "Foto no encontrada" };
  await autorizarStaff(foto.orden.tallerId);

  await prisma.ordenFoto.delete({ where: { id: fotoId } });

  revalidatePath(`/panel/ordenes/${foto.orden.id}`);
  revalidatePath(`/mi-cuenta/ordenes/${foto.orden.id}`);
  return { ok: true };
}
