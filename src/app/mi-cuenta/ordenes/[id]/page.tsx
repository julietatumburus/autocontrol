import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import {
  formatMoney,
  ORDEN_ESTADO_LABEL,
  ORDEN_ESTADO_COLOR,
} from "@/lib/utils";
import Timeline from "@/components/Timeline";
import Chat from "@/components/Chat";
import GaleriaPorEtapa from "@/components/GaleriaPorEtapa";
import GarantiaBadge from "@/components/GarantiaBadge";
import PresupuestoDetalle, {
  type PresupuestoItem,
} from "@/components/PresupuestoDetalle";
import PresupuestoAprobacion from "./PresupuestoAprobacion";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  REPUESTO: "Repuesto",
  PRODUCTO: "Producto",
  MANO_OBRA: "Mano de obra",
};

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id },
    include: {
      vehiculo: true,
      taller: true,
      cliente: { select: { dni: true } },
      etapaActual: true,
      items: { orderBy: { creadoEn: "asc" } },
      timeline: { orderBy: { ingresoEn: "asc" } },
      comprobantes: true,
      presupuestos: { orderBy: { enviadoEn: "desc" } },
      mensajes: { include: { autor: true }, orderBy: { creadoEn: "asc" } },
      fotos: { orderBy: { creadoEn: "desc" } },
    },
  });

  // Seguridad: la orden debe ser del cliente logueado
  if (!orden || orden.clienteId !== session!.user.id) notFound();

  // Marcar como vista por el cliente (limpia el indicador "mensaje nuevo")
  await prisma.ordenDeTrabajo.update({
    where: { id },
    data: { vistoClienteEn: new Date() },
  });

  const comprobante = orden.comprobantes[0];
  const presupuesto = orden.presupuestos[0];
  const detalle = presupuesto?.detalle as
    | { items: PresupuestoItem[]; total: string }
    | undefined;

  return (
    <div className="space-y-6">
      <Link href="/mi-cuenta" className="text-sm text-brand-600 hover:underline">
        ← Mis órdenes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {orden.vehiculo.marca} {orden.vehiculo.modelo}
            </h1>
            <Badge className={ORDEN_ESTADO_COLOR[orden.estado]}>
              {ORDEN_ESTADO_LABEL[orden.estado]}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Orden #{orden.numero} · {orden.vehiculo.patente} · 🔧{" "}
            {orden.taller.nombre}
          </p>
        </div>
      </div>

      {/* Garantía (cuando el vehículo ya fue entregado) */}
      {orden.estado === "ENTREGADA" &&
        orden.taller.garantiaActiva &&
        orden.entregadaEn && (
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Garantía</h2>
            <GarantiaBadge
              entregadaEn={orden.entregadaEn}
              meses={orden.taller.garantiaMeses}
            />
          </Card>
        )}

      {/* Presupuesto para aprobar (acción pendiente del cliente) */}
      {presupuesto?.estado === "ENVIADO" && detalle && (
        <Card className="border-brand-200 bg-brand-50/50">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              📄 Tenés un presupuesto para aprobar
            </h2>
            <Badge className="bg-amber-100 text-amber-700">
              {presupuesto.numero}
            </Badge>
          </div>
          <p className="mb-4 mt-1 text-sm text-slate-600">
            {orden.taller.nombre} te envió este presupuesto. Revisalo y aprobalo
            o rechazalo.
          </p>
          {presupuesto.nota && (
            <p className="mb-4 rounded-lg bg-white/70 p-3 text-sm text-slate-600">
              “{presupuesto.nota}”
            </p>
          )}
          <PresupuestoDetalle items={detalle.items} total={detalle.total} />
          <div className="mt-4">
            <PresupuestoAprobacion
              presupuestoId={presupuesto.id}
              dniActual={orden.cliente.dni ?? ""}
            />
          </div>
        </Card>
      )}

      {/* Estado del presupuesto ya respondido */}
      {presupuesto?.estado === "APROBADO" && (
        <Card className="border-green-200 bg-green-50">
          <p className="font-semibold text-green-800">
            ✓ Aprobaste el presupuesto {presupuesto.numero}
          </p>
          <Link
            href={`/contrato/${presupuesto.id}`}
            className="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            Ver contrato →
          </Link>
        </Card>
      )}
      {presupuesto?.estado === "RECHAZADO" && (
        <Card className="border-slate-200">
          <p className="text-sm text-slate-600">
            Rechazaste el presupuesto {presupuesto.numero}. El taller puede
            enviarte uno nuevo.
          </p>
        </Card>
      )}

      {/* Aviso destacado cuando está listo */}
      {orden.estado === "LISTA" && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-800">
            🎉 ¡Tu auto está listo para retirar!
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Acercate a {orden.taller.nombre} para retirarlo y abonar{" "}
            <strong>{formatMoney(orden.total)}</strong>.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">
              Evolución de tu reparación
            </h2>
            <Timeline
              eventos={orden.timeline.map((t) => ({
                nombre: t.nombre,
                nota: t.nota,
                ingresoEn: t.ingresoEn,
                salidaEn: t.salidaEn,
              }))}
            />
          </Card>

          {orden.fotos.length > 0 && (
            <Card>
              <h2 className="mb-1 font-semibold text-slate-900">
                Fotos del avance
              </h2>
              <p className="mb-4 text-sm text-slate-500">
                Las fotos que el taller fue subiendo de tu reparación.
              </p>
              <GaleriaPorEtapa
                fotos={orden.fotos.map((f) => ({
                  id: f.id,
                  url: f.url,
                  descripcion: f.descripcion,
                  etapaNombre: f.etapaNombre,
                  creadoEn: f.creadoEn,
                }))}
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Detalle del costo</h2>
            {orden.items.length === 0 ? (
              <p className="text-sm text-slate-500">
                Todavía no se cargaron repuestos ni trabajos.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {orden.items.map((it) => (
                  <li key={it.id} className="flex justify-between py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate text-slate-800">
                        {it.nombre}
                      </span>
                      <span className="text-xs text-slate-400">
                        {TIPO_LABEL[it.tipo]} · {it.cantidad.toString()} ×{" "}
                        {formatMoney(it.precioUnitario)}
                      </span>
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatMoney(it.cantidad.mul(it.precioUnitario))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
              <span className="font-semibold text-slate-600">Total</span>
              <span className="text-lg font-bold text-slate-900">
                {formatMoney(orden.total)}
              </span>
            </div>
          </Card>

          {comprobante && (
            <Card className="bg-green-50">
              <p className="text-sm text-green-700">
                ✅ Pago registrado. Tu comprobante está listo.
              </p>
              <Link
                href={`/comprobante/${comprobante.id}`}
                className="mt-2 inline-block font-medium text-brand-600 hover:underline"
              >
                Ver comprobante {comprobante.numero} →
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Conversación con el taller */}
      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">
          Conversación con el taller
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Consultá lo que necesites sobre tu reparación.
        </p>
        <Chat
          ordenId={orden.id}
          mensajes={orden.mensajes.map((m) => ({
            id: m.id,
            cuerpo: m.cuerpo,
            creadoEn: m.creadoEn,
            autorNombre: m.autor.nombre,
            mine: m.autorId === session!.user.id,
          }))}
        />
      </Card>
    </div>
  );
}
