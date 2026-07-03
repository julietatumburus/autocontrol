"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Result = { error?: string; ok?: boolean };

/** Solo el ADMIN del taller (o super admin) puede configurar etapas. */
async function autorizarAdmin(tallerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role === "SUPER_ADMIN") return;
  const member = await prisma.tallerMember.findUnique({
    where: { userId_tallerId: { userId: session.user.id, tallerId } },
  });
  if (!member || member.role !== "ADMIN") {
    throw new Error("Solo el administrador del taller puede configurar etapas");
  }
}

async function autorizarPorEtapa(etapaId: string) {
  const etapa = await prisma.etapaCatalogo.findUnique({ where: { id: etapaId } });
  if (!etapa) throw new Error("Etapa no encontrada");
  await autorizarAdmin(etapa.tallerId);
  return etapa;
}

const agregarSchema = z.object({
  tallerId: z.string().min(1),
  nombre: z.string().trim().min(1, "Poné un nombre").max(40),
  color: z.string().optional(),
});

/** Agrega una etapa al final del flujo del taller. */
export async function agregarEtapa(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = agregarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { tallerId, nombre, color } = parsed.data;
  await autorizarAdmin(tallerId);

  const max = await prisma.etapaCatalogo.aggregate({
    where: { tallerId },
    _max: { orden: true },
  });
  const orden = (max._max.orden ?? 0) + 1;

  await prisma.etapaCatalogo.create({
    data: { tallerId, nombre, color: color || "#3b82f6", orden, esFinal: false },
  });

  revalidatePath("/panel/config");
  return { ok: true };
}

/** Edita nombre, color y si es la etapa final (solo una final por taller). */
export async function actualizarEtapa(
  etapaId: string,
  nombre: string,
  color: string,
  esFinal: boolean,
): Promise<Result> {
  const etapa = await autorizarPorEtapa(etapaId);
  const nombreTrim = nombre.trim();
  if (!nombreTrim) return { error: "El nombre no puede estar vacío" };

  await prisma.$transaction(async (tx) => {
    if (esFinal) {
      await tx.etapaCatalogo.updateMany({
        where: { tallerId: etapa.tallerId, esFinal: true, NOT: { id: etapaId } },
        data: { esFinal: false },
      });
    }
    await tx.etapaCatalogo.update({
      where: { id: etapaId },
      data: { nombre: nombreTrim.slice(0, 40), color, esFinal },
    });
  });

  revalidatePath("/panel/config");
  return { ok: true };
}

/** Sube o baja una etapa intercambiando posición con su vecina. */
export async function moverEtapa(
  etapaId: string,
  dir: "subir" | "bajar",
): Promise<Result> {
  const etapa = await autorizarPorEtapa(etapaId);
  const vecino = await prisma.etapaCatalogo.findFirst({
    where: {
      tallerId: etapa.tallerId,
      orden: dir === "subir" ? { lt: etapa.orden } : { gt: etapa.orden },
    },
    orderBy: { orden: dir === "subir" ? "desc" : "asc" },
  });
  if (!vecino) return { ok: true }; // ya está en el extremo

  // Swap con un valor temporal para no violar el unique (tallerId, orden)
  await prisma.$transaction([
    prisma.etapaCatalogo.update({ where: { id: etapa.id }, data: { orden: -1 } }),
    prisma.etapaCatalogo.update({
      where: { id: vecino.id },
      data: { orden: etapa.orden },
    }),
    prisma.etapaCatalogo.update({
      where: { id: etapa.id },
      data: { orden: vecino.orden },
    }),
  ]);

  revalidatePath("/panel/config");
  return { ok: true };
}

/** Elimina una etapa (si no es la única ni está en uso como etapa actual). */
export async function eliminarEtapa(etapaId: string): Promise<Result> {
  const etapa = await autorizarPorEtapa(etapaId);

  const total = await prisma.etapaCatalogo.count({
    where: { tallerId: etapa.tallerId },
  });
  if (total <= 1) {
    return { error: "Tenés que tener al menos una etapa." };
  }

  const enUso = await prisma.ordenDeTrabajo.count({
    where: { etapaActualId: etapaId },
  });
  if (enUso > 0) {
    return {
      error: `No podés eliminar esta etapa: ${enUso} orden(es) la están usando ahora.`,
    };
  }

  // Conservamos el historial (OrdenEtapa guarda el nombre); solo desvinculamos.
  await prisma.$transaction([
    prisma.ordenEtapa.updateMany({
      where: { etapaCatalogoId: etapaId },
      data: { etapaCatalogoId: null },
    }),
    prisma.etapaCatalogo.delete({ where: { id: etapaId } }),
  ]);

  revalidatePath("/panel/config");
  return { ok: true };
}
