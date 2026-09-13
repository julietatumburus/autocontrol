import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Consultas del listado público de talleres.
//
// Las páginas públicas no se pueden cachear enteras: `PublicNav` lee la sesión
// (cookies) en el layout, y eso vuelve dinámica a toda la rama. Lo que sí se
// puede cachear es lo caro —la consulta a Postgres—, que además es idéntica
// para todo el mundo.

export const TAG_TALLERES = "talleres-publicos";

/** Talleres destacados de la portada. */
export const getTalleresDestacados = unstable_cache(
  async () =>
    prisma.taller.findMany({
      where: { estado: "ACTIVO" },
      include: { _count: { select: { ordenes: true, servicios: true } } },
      orderBy: { creadoEn: "desc" },
      take: 12,
    }),
  ["talleres-destacados"],
  { revalidate: 60, tags: [TAG_TALLERES] },
);

/** Listado completo, sin búsqueda (el caso cacheable). */
const getTalleresTodos = unstable_cache(
  async () =>
    prisma.taller.findMany({
      where: { estado: "ACTIVO" },
      include: { _count: { select: { servicios: true, ordenes: true } } },
      orderBy: { nombre: "asc" },
    }),
  ["talleres-listado"],
  { revalidate: 60, tags: [TAG_TALLERES] },
);

/**
 * Listado de talleres, filtrado por texto si hay búsqueda.
 * Solo se cachea el listado sin filtro: cachear cada término suelto llenaría
 * la caché de claves que no se vuelven a usar.
 */
export async function getTalleresPublicos(q: string) {
  if (!q) return getTalleresTodos();

  const where: Prisma.TallerWhereInput = {
    estado: "ACTIVO",
    OR: [
      { nombre: { contains: q, mode: "insensitive" } },
      { direccion: { contains: q, mode: "insensitive" } },
    ],
  };
  return prisma.taller.findMany({
    where,
    include: { _count: { select: { servicios: true, ordenes: true } } },
    orderBy: { nombre: "asc" },
  });
}
