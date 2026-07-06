"use server";

import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";

/** El super admin entra como otro usuario (login-as). */
export async function impersonar(targetUserId: string): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Solo el super admin puede impersonar.");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, nombre: true, email: true },
  });
  if (!target) throw new Error("Usuario no encontrado.");

  // Registro de la acción (auditoría básica)
  console.log(
    `[IMPERSONATE] ${session.user.nombre} (${session.user.id}) → ${target.nombre} (${target.email}) @ ${new Date().toISOString()}`,
  );

  // @ts-expect-error el update pasa datos arbitrarios al jwt callback
  await unstable_update({
    impersonate: { id: target.id, role: target.role, nombre: target.nombre },
  });

  const destino =
    target.role === "SUPER_ADMIN"
      ? "/admin"
      : target.role === "TALLER"
        ? "/panel"
        : "/mi-cuenta";
  redirect(destino);
}

/** Vuelve a la cuenta real del super admin. */
export async function dejarDeImpersonar(): Promise<void> {
  const session = await auth();
  if (!session?.impersonating) {
    redirect("/admin");
  }
  console.log(`[IMPERSONATE] fin de impersonación @ ${new Date().toISOString()}`);

  // @ts-expect-error el update pasa datos arbitrarios al jwt callback
  await unstable_update({ stopImpersonate: true });
  redirect("/admin/clientes");
}
