"use server";

import { revalidatePath } from "next/cache";
import { TallerEstado } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function soloSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Solo el super admin puede hacer esto");
  }
}

export async function cambiarEstadoTaller(
  tallerId: string,
  estado: TallerEstado,
): Promise<void> {
  await soloSuperAdmin();
  await prisma.taller.update({ where: { id: tallerId }, data: { estado } });
  revalidatePath("/admin");
}

/** Da de baja (o reactiva) una cuenta de usuario. */
export async function cambiarEstadoUsuario(
  userId: string,
  activo: boolean,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return { error: "Solo el super admin puede hacer esto" };
  }
  if (userId === session.user.id) {
    return { error: "No podés darte de baja a vos mismo." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return { error: "Usuario no encontrado." };
  if (user.role === "SUPER_ADMIN") {
    return { error: "No se puede dar de baja a un super admin." };
  }

  await prisma.user.update({ where: { id: userId }, data: { activo } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
