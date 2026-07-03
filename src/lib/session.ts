import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Devuelve la sesión o redirige a /login si no hay. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Devuelve el taller (y rol interno) del staff logueado, o null. */
export async function getTallerDelUsuario(userId: string) {
  const membership = await prisma.tallerMember.findFirst({
    where: { userId },
    include: { taller: true },
    orderBy: { creadoEn: "asc" },
  });
  return membership;
}

/** Exige que el usuario sea staff de un taller; devuelve membership + taller. */
export async function requireTaller() {
  const user = await requireUser();
  if (user.role === "CLIENTE") redirect("/mi-cuenta");
  const membership = await getTallerDelUsuario(user.id);
  if (!membership && user.role !== "SUPER_ADMIN") {
    redirect("/panel/crear-taller");
  }
  return { user, membership };
}
