import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { TallerLogo } from "@/components/TallerLogo";
import { MapPinIcon, SearchIcon } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TalleresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q?.trim() ?? "";

  const where: Prisma.TallerWhereInput = { estado: "ACTIVO" };
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { direccion: { contains: q, mode: "insensitive" } },
    ];
  }

  const talleres = await prisma.taller.findMany({
    where,
    include: { _count: { select: { servicios: true, ordenes: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Talleres</h1>
      <p className="mt-2 text-slate-500">
        Elegí un taller para ver qué ofrece y empezá a seguir tu reparación.
      </p>

      {/* Buscador por nombre o ubicación */}
      <form method="get" className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o ubicación…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Buscar
        </button>
      </form>

      {q && (
        <p className="mt-3 text-sm text-slate-500">
          {talleres.length} resultado{talleres.length === 1 ? "" : "s"} para
          «{q}» ·{" "}
          <Link href="/talleres" className="font-medium text-brand-600 hover:underline">
            Ver todos
          </Link>
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {talleres.map((t) => (
          <Link key={t.id} href={`/talleres/${t.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <TallerLogo src={t.logoUrl} nombre={t.nombre} size={48} />
                <Badge className="bg-green-100 text-green-700">Activo</Badge>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{t.nombre}</h3>
              {t.direccion && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPinIcon size={14} className="text-slate-400" /> {t.direccion}
                </p>
              )}
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {t.descripcion ?? "Taller en Autocontrol"}
              </p>
            </Card>
          </Link>
        ))}
        {talleres.length === 0 && (
          <Card className="col-span-full text-center text-slate-500">
            {q
              ? `No encontramos talleres para «${q}».`
              : "Todavía no hay talleres activos."}
          </Card>
        )}
      </div>
    </div>
  );
}
