import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { MessageIcon } from "@/components/icons";
import {
  formatMoney,
  formatDate,
  ORDEN_ESTADO_LABEL,
  ORDEN_ESTADO_COLOR,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MiCuentaPage() {
  const session = await auth();

  const ordenes = await prisma.ordenDeTrabajo.findMany({
    where: { clienteId: session!.user.id },
    include: {
      vehiculo: true,
      taller: true,
      etapaActual: true,
      mensajes: {
        orderBy: { creadoEn: "desc" },
        take: 1,
        select: { autorId: true, creadoEn: true },
      },
    },
    orderBy: { actualizadoEn: "desc" },
  });

  // Mensaje del taller sin ver desde la última vez que el cliente abrió la orden
  const sinVer = (o: (typeof ordenes)[number]) => {
    const last = o.mensajes[0];
    return (
      !!last &&
      last.autorId !== o.clienteId &&
      (!o.vistoClienteEn || last.creadoEn > o.vistoClienteEn)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {session!.user.nombre} 👋
        </h1>
        <p className="text-sm text-slate-500">
          Seguí acá la evolución de tus vehículos.
        </p>
      </div>

      {ordenes.length === 0 ? (
        <Card className="text-center text-slate-500">
          Todavía no tenés órdenes. Cuando un taller registre tu vehículo, vas a
          verlo acá.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ordenes.map((o) => (
            <Link key={o.id} href={`/mi-cuenta/ordenes/${o.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {o.vehiculo.marca} {o.vehiculo.modelo}
                    </p>
                    <p className="text-xs text-slate-400">{o.vehiculo.patente}</p>
                  </div>
                  <Badge className={ORDEN_ESTADO_COLOR[o.estado]}>
                    {ORDEN_ESTADO_LABEL[o.estado]}
                  </Badge>
                </div>
                {sinVer(o) && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    <MessageIcon size={12} /> Mensaje nuevo del taller
                  </span>
                )}
                <p className="mt-3 text-sm text-slate-500">🔧 {o.taller.nombre}</p>
                {o.etapaActual && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: o.etapaActual.color }}
                    />
                    {o.etapaActual.nombre}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">
                    {formatDate(o.creadoEn)}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {formatMoney(o.total)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
