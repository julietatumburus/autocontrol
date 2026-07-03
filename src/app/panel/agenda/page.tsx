import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { Card, Badge } from "@/components/ui";
import { formatTurno } from "@/lib/agenda";
import TurnoAcciones from "./TurnoAcciones";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  VISITA: "Visita",
};
const ESTADO_COLOR: Record<string, string> = {
  SOLICITADO: "bg-amber-100 text-amber-700",
  CONFIRMADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700",
  COMPLETADO: "bg-slate-100 text-slate-700",
};
const ESTADO_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  COMPLETADO: "Completado",
};

export default async function AgendaPage() {
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);
  if (!membership) return <Card>No tenés un taller asociado.</Card>;

  const ahora = new Date();
  const [proximos, pasados] = await Promise.all([
    prisma.turno.findMany({
      where: { tallerId: membership.tallerId, fechaHora: { gte: ahora } },
      orderBy: { fechaHora: "asc" },
    }),
    prisma.turno.findMany({
      where: { tallerId: membership.tallerId, fechaHora: { lt: ahora } },
      orderBy: { fechaHora: "desc" },
      take: 20,
    }),
  ]);

  const filaTurno = (t: (typeof proximos)[number]) => (
    <div
      key={t.id}
      className="flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium capitalize text-slate-900">
            {formatTurno(t.fechaHora)}
          </span>
          <Badge className="bg-brand-50 text-brand-700">{TIPO_LABEL[t.tipo]}</Badge>
          <Badge className={ESTADO_COLOR[t.estado]}>{ESTADO_LABEL[t.estado]}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {t.nombre}
          {t.telefono ? ` · ${t.telefono}` : ""} · {t.email}
        </p>
        {(t.vehiculo || t.motivo) && (
          <p className="text-sm text-slate-400">
            {t.vehiculo}
            {t.vehiculo && t.motivo ? " — " : ""}
            {t.motivo}
          </p>
        )}
      </div>
      <TurnoAcciones turnoId={t.id} estado={t.estado} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
        <p className="text-sm text-slate-500">
          Turnos de presupuesto y visitas reservados por tus clientes.
        </p>
      </div>

      <Card>
        <h2 className="mb-2 font-semibold text-slate-900">Próximos turnos</h2>
        {proximos.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No hay turnos próximos.
          </p>
        ) : (
          <div>{proximos.map(filaTurno)}</div>
        )}
      </Card>

      {pasados.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold text-slate-900">Historial</h2>
          <div className="opacity-75">{pasados.map(filaTurno)}</div>
        </Card>
      )}
    </div>
  );
}
