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
