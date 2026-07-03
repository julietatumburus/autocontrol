import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { TallerLogo } from "@/components/TallerLogo";
import { MapPinIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TalleresPage() {
  const talleres = await prisma.taller.findMany({
    where: { estado: "ACTIVO" },
    include: { _count: { select: { servicios: true, ordenes: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Talleres</h1>
      <p className="mt-2 text-slate-500">
        Elegí un taller para ver qué ofrece y empezá a seguir tu reparación.
      </p>

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
            Todavía no hay talleres activos.
          </Card>
        )}
      </div>
    </div>
  );
}
