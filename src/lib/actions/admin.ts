"use server";

import { revalidatePath } from "next/cache";
import { TallerEstado, UserRole } from "@prisma/client";
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

/** Elimina definitivamente una cuenta de usuario y sus datos (solo super admin). */
export async function eliminarUsuario(
  userId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return { error: "Solo el super admin puede hacer esto" };
  }
  if (userId === session.user.id) {
    return { error: "No podés eliminar tu propia cuenta." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return { error: "Usuario no encontrado." };
  if (target.role === "SUPER_ADMIN") {
    return { error: "No se puede eliminar a un super admin." };
  }

  // Borramos primero lo que tiene FK obligatoria hacia el usuario, luego el usuario
  // (el resto —vehículos, notificaciones, membresías, tokens— cae por cascada).
  await prisma.$transaction([
    prisma.mensaje.deleteMany({ where: { autorId: userId } }),
    prisma.ordenDeTrabajo.deleteMany({ where: { clienteId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Cambia el rol de un usuario (solo super admin). */
export async function cambiarRolUsuario(
  userId: string,
  role: UserRole,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return { error: "Solo el super admin puede hacer esto" };
  }
  if (userId === session.user.id) {
    return { error: "No podés cambiar tu propio rol." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return { error: "Usuario no encontrado." };

  // No dejar la plataforma sin ningún super admin
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdmins <= 1) {
      return { error: "Tiene que quedar al menos un super admin." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
