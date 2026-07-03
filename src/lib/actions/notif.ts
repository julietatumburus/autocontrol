"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/** Marca todas las notificaciones del usuario logueado como leídas. */
export async function marcarTodasLeidas(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.notificacion.updateMany({
    where: { userId: session.user.id, leidaEn: null },
    data: { leidaEn: new Date() },
  });
  revalidatePath("/mi-cuenta/notificaciones");
  revalidatePath("/mi-cuenta");
}
