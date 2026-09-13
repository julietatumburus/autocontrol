import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Cookie con el taller activo, para quien es staff de más de uno. */
export const COOKIE_TALLER = "taller_activo";

/** Devuelve la sesión o redirige a /login si no hay. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Todas las membresías del usuario (un usuario puede ser staff de varios talleres). */
export async function getMembresias(userId: string) {
  return prisma.tallerMember.findMany({
    where: { userId },
    include: { taller: true },
    orderBy: { creadoEn: "asc" },
  });
}

/**
 * Membresía activa del staff logueado, o null.
 *
 * El modelo permite pertenecer a varios talleres, pero antes esto hacía un
 * `findFirst` y el resto quedaba inaccesible. Ahora respeta el taller elegido
 * (cookie) y cae al primero cuando no hay elección válida.
 */
export async function getTallerDelUsuario(userId: string) {
  const membresias = await getMembresias(userId);
  if (membresias.length === 0) return null;
  if (membresias.length === 1) return membresias[0];

  const elegido = (await cookies()).get(COOKIE_TALLER)?.value;
  return membresias.find((m) => m.tallerId === elegido) ?? membresias[0];
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
