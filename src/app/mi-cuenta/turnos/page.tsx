import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, ButtonLink } from "@/components/ui";
import { formatTurno } from "@/lib/agenda";
import CancelarTurno from "./CancelarTurno";

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

export default async function MisTurnosPage() {
  const session = await auth();
  const turnos = await prisma.turno.findMany({
    where: { clienteId: session!.user.id },
    include: { taller: { select: { nombre: true, slug: true } } },
    orderBy: { fechaHora: "desc" },
  });

  const ahora = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mis turnos</h1>
        <ButtonLink href="/talleres">+ Sacar turno</ButtonLink>
      </div>

      {turnos.length === 0 ? (
        <Card className="text-center text-slate-500">
          No tenés turnos. Tocá{" "}
          <Link href="/talleres" className="font-medium text-brand-600 hover:underline">
            + Sacar turno
          </Link>{" "}
          y elegí el taller donde querés agendar.
        </Card>
      ) : (
        <div className="space-y-3">
          {turnos.map((t) => {
            const futuro = new Date(t.fechaHora).getTime() > ahora;
            const cancelable =
              futuro && (t.estado === "SOLICITADO" || t.estado === "CONFIRMADO");
            return (
              <Card key={t.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium capitalize text-slate-900">
                        {formatTurno(t.fechaHora)}
                      </span>
                      <Badge className="bg-brand-50 text-brand-700">
                        {TIPO_LABEL[t.tipo]}
                      </Badge>
                      <Badge className={ESTADO_COLOR[t.estado]}>
                        {ESTADO_LABEL[t.estado]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      🔧 {t.taller.nombre}
                    </p>
                  </div>
                  {cancelable && <CancelarTurno turnoId={t.id} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
