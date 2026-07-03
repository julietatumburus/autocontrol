import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { Card, Badge, ButtonLink } from "@/components/ui";
import { MessageIcon } from "@/components/icons";
import GarantiaBadge from "@/components/GarantiaBadge";
import {
  formatMoney,
  formatDate,
  ORDEN_ESTADO_LABEL,
  ORDEN_ESTADO_COLOR,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);
  if (!membership) {
    return <Card>No tenés un taller asociado.</Card>;
  }

  const taller = membership.taller;

  const ordenes = await prisma.ordenDeTrabajo.findMany({
    where: { tallerId: membership.tallerId },
    include: {
      vehiculo: true,
      cliente: true,
      etapaActual: true,
      mensajes: {
        orderBy: { creadoEn: "desc" },
        take: 1,
        select: { autorId: true, creadoEn: true },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  type Orden = (typeof ordenes)[number];

  const sinVer = (o: Orden) => {
    const last = o.mensajes[0];
    return (
      !!last &&
      last.autorId === o.clienteId &&
      (!o.vistoTallerEn || last.creadoEn > o.vistoTallerEn)
    );
  };

  const vigentes = ordenes.filter(
    (o) => o.estado !== "ENTREGADA" && o.estado !== "CANCELADA",
  );
  const historial = ordenes.filter(
    (o) => o.estado === "ENTREGADA" || o.estado === "CANCELADA",
  );

  const tabla = (lista: Orden[], esHistorial: boolean) => (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">{esHistorial ? "Garantía" : "Etapa"}</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">{esHistorial ? "Cierre" : "Ingreso"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/panel/ordenes/${o.id}`}
                    className="flex items-center gap-1.5 font-medium text-brand-600"
                  >
                    {sinVer(o) && (
                      <span
                        className="h-2 w-2 rounded-full bg-red-500"
                        title="Mensaje sin responder"
                      />
                    )}
                    #{o.numero}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/panel/ordenes/${o.id}`} className="block">
                    <span className="font-medium text-slate-900">
                      {o.vehiculo.marca} {o.vehiculo.modelo}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {o.vehiculo.patente}
                    </span>
                    {sinVer(o) && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        <MessageIcon size={12} /> Mensaje nuevo
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{o.cliente.nombre}</td>
                <td className="px-4 py-3">
                  {esHistorial ? (
                    o.estado === "ENTREGADA" &&
                    taller.garantiaActiva &&
                    o.entregadaEn ? (
                      <GarantiaBadge
                        entregadaEn={o.entregadaEn}
                        meses={taller.garantiaMeses}
                        compact
                      />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )
                  ) : o.etapaActual ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: o.etapaActual.color }}
                      />
                      {o.etapaActual.nombre}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className={ORDEN_ESTADO_COLOR[o.estado]}>
                    {ORDEN_ESTADO_LABEL[o.estado]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {formatMoney(o.total)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {esHistorial
                    ? formatDate(o.entregadaEn ?? o.actualizadoEn)
                    : formatDate(o.creadoEn)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
        <ButtonLink href="/panel/ordenes/nueva">+ Nueva orden</ButtonLink>
      </div>

      {ordenes.length === 0 ? (
        <Card className="text-center text-slate-500">
          Todavía no hay órdenes.{" "}
          <Link href="/panel/ordenes/nueva" className="text-brand-600 hover:underline">
            Creá la primera
          </Link>
          .
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Vigentes ({vigentes.length})
            </h2>
            {vigentes.length === 0 ? (
              <Card className="text-center text-sm text-slate-500">
                No hay órdenes en curso.
              </Card>
            ) : (
              tabla(vigentes, false)
            )}
          </section>

          {historial.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Historial ({historial.length})
              </h2>
              {tabla(historial, true)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
