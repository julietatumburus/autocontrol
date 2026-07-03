import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { TallerLogo } from "@/components/TallerLogo";
import {
  proximasFechas,
  slotsDisponibles,
  etiquetaFecha,
} from "@/lib/agenda";
import ReservarTurno from "./ReservarTurno";

export const dynamic = "force-dynamic";

export default async function TurnoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const taller = await prisma.taller.findUnique({ where: { slug } });
  if (!taller || taller.estado !== "ACTIVO") notFound();

  const session = await auth();

  if (!taller.agendaActiva) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href={`/talleres/${slug}`} className="text-sm text-brand-600 hover:underline">
          ← Volver al taller
        </Link>
        <Card className="mt-6 text-center text-slate-500">
          {taller.nombre} no está tomando turnos online por el momento.
        </Card>
      </div>
    );
  }

  // Turnos ya tomados (futuros) para excluir slots
  const tomados = await prisma.turno.findMany({
    where: {
      tallerId: taller.id,
      estado: { not: "CANCELADO" },
      fechaHora: { gte: new Date() },
    },
    select: { fechaHora: true },
  });
  const ocupados = new Set(tomados.map((t) => t.fechaHora.toISOString()));

  const fechas = proximasFechas(taller, 14)
    .map((fecha) => ({
      fecha,
      etiqueta: etiquetaFecha(fecha),
      slots: slotsDisponibles(taller, fecha, ocupados),
    }))
    .filter((f) => f.slots.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href={`/talleres/${slug}`} className="text-sm text-brand-600 hover:underline">
        ← Volver al taller
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <TallerLogo src={taller.logoUrl} nombre={taller.nombre} size={56} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sacar un turno</h1>
          <p className="text-sm text-slate-500">{taller.nombre}</p>
        </div>
      </div>

      <Card className="mt-6">
        {fechas.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No hay horarios disponibles en los próximos días. Probá más tarde o
            contactá al taller.
          </p>
        ) : (
          <ReservarTurno
            tallerId={taller.id}
            fechas={fechas}
            logueado={!!session?.user}
            nombre={session?.user?.nombre ?? ""}
            email={session?.user?.email ?? ""}
          />
        )}
      </Card>
    </div>
  );
}
