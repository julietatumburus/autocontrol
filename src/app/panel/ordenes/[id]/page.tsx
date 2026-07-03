import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { Card, Badge } from "@/components/ui";
import {
  formatMoney,
  formatDate,
  ORDEN_ESTADO_LABEL,
  ORDEN_ESTADO_COLOR,
} from "@/lib/utils";
import Timeline from "@/components/Timeline";
import Chat from "@/components/Chat";
import GaleriaPorEtapa from "@/components/GaleriaPorEtapa";
import AvanzarEtapa from "./AvanzarEtapa";
import FotosUploader from "./FotosUploader";
import ItemsManager from "./ItemsManager";
import RegistrarPago from "./RegistrarPago";
import AccionesOrden from "./AccionesOrden";
import EnviarPresupuesto from "./EnviarPresupuesto";

export const dynamic = "force-dynamic";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id },
    include: {
      vehiculo: true,
      cliente: true,
      taller: true,
      etapaActual: true,
      items: { orderBy: { creadoEn: "asc" } },
      timeline: { orderBy: { ingresoEn: "asc" } },
      pagos: true,
      comprobantes: true,
      presupuestos: { orderBy: { enviadoEn: "desc" } },
      mensajes: { include: { autor: true }, orderBy: { creadoEn: "asc" } },
      fotos: { orderBy: { creadoEn: "desc" } },
    },
  });

  if (!orden) notFound();
  // Seguridad: solo staff del taller (o super admin)
  if (
    session!.user.role !== "SUPER_ADMIN" &&
    membership?.tallerId !== orden.tallerId
  ) {
    notFound();
  }

  // Marcar como vista por el taller (limpia el indicador "mensaje nuevo")
  await prisma.ordenDeTrabajo.update({
    where: { id },
    data: { vistoTallerEn: new Date() },
  });

  const etapas = await prisma.etapaCatalogo.findMany({
    where: { tallerId: orden.tallerId },
    orderBy: { orden: "asc" },
  });

  const comprobante = orden.comprobantes[0];
  const presupuesto = orden.presupuestos[0]; // el más reciente
  const ordenAbierta =
    orden.estado === "ABIERTA" || orden.estado === "LISTA";

  return (
    <div className="space-y-6">
      <Link href="/panel/ordenes" className="text-sm text-brand-600 hover:underline">
        ← Volver a órdenes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Orden #{orden.numero}
            </h1>
            <Badge className={ORDEN_ESTADO_COLOR[orden.estado]}>
              {ORDEN_ESTADO_LABEL[orden.estado]}
            </Badge>
          </div>
          <p className="mt-1 text-slate-600">
            {orden.vehiculo.marca} {orden.vehiculo.modelo}
            {orden.vehiculo.anio ? ` ${orden.vehiculo.anio}` : ""} ·{" "}
            <span className="font-medium">{orden.vehiculo.patente}</span>
          </p>
          <p className="text-sm text-slate-500">
            Cliente: {orden.cliente.nombre} ({orden.cliente.email})
          </p>
        </div>
        <Card className="min-w-[180px] text-right">
          <p className="text-xs text-slate-500">Total acumulado</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatMoney(orden.total)}
          </p>
        </Card>
      </div>

      {orden.descripcionProblema && (
        <Card>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Problema reportado
          </p>
          <p className="mt-1 text-slate-700">{orden.descripcionProblema}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: etapas + timeline */}
        <div className="space-y-6 lg:col-span-2">
          {orden.estado !== "ENTREGADA" && orden.estado !== "CANCELADA" && (
            <Card>
              <h2 className="font-semibold text-slate-900">Avanzar etapa</h2>
              <p className="mb-3 text-sm text-slate-500">
                Mové la orden por el flujo del taller. El cliente recibe el aviso
                automáticamente.
              </p>
              <AvanzarEtapa
                ordenId={orden.id}
                etapaActualId={orden.etapaActualId}
                etapas={etapas.map((e) => ({
                  id: e.id,
                  nombre: e.nombre,
                  color: e.color,
                  esFinal: e.esFinal,
                }))}
              />
            </Card>
          )}

          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">
              Evolución de la reparación
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

          <Card>
            <h2 className="mb-1 font-semibold text-slate-900">Fotos del avance</h2>
            <p className="mb-4 text-sm text-slate-500">
              Mostrale al cliente cómo va. Las fotos se ven en tiempo real desde
              su cuenta.
            </p>
            {orden.estado !== "ENTREGADA" && orden.estado !== "CANCELADA" && (
              <div className="mb-4">
                <FotosUploader
                  ordenId={orden.id}
                  etapas={etapas.map((e) => e.nombre)}
                  etapaActual={orden.etapaActual?.nombre ?? null}
                />
              </div>
            )}
            <GaleriaPorEtapa
              editable
              fotos={orden.fotos.map((f) => ({
                id: f.id,
                url: f.url,
                descripcion: f.descripcion,
                etapaNombre: f.etapaNombre,
                creadoEn: f.creadoEn,
              }))}
            />
          </Card>
        </div>

        {/* Columna derecha: items + pago */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">
              Repuestos y trabajos
            </h2>
            <ItemsManager
              ordenId={orden.id}
              editable={orden.estado === "ABIERTA" || orden.estado === "LISTA"}
              items={orden.items.map((it) => ({
                id: it.id,
                tipo: it.tipo,
                nombre: it.nombre,
                cantidad: it.cantidad.toString(),
                precioUnitario: it.precioUnitario.toString(),
              }))}
              total={orden.total.toString()}
            />
          </Card>

          {/* Presupuesto / aprobación del cliente */}
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Presupuesto</h2>
            {presupuesto?.estado === "APROBADO" ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-green-700">
                  ✓ {presupuesto.numero} aprobado por {presupuesto.clienteNombre}
                </p>
                <p className="text-slate-500">
                  {presupuesto.respondidoEn && formatDate(presupuesto.respondidoEn)}
                </p>
                <Link
                  href={`/contrato/${presupuesto.id}`}
                  className="inline-block font-medium text-brand-600 hover:underline"
                >
                  Ver contrato {presupuesto.numero} →
                </Link>
              </div>
            ) : presupuesto?.estado === "ENVIADO" ? (
              <div className="space-y-1 text-sm">
                <Badge className="bg-amber-100 text-amber-700">
                  Esperando respuesta
                </Badge>
                <p className="mt-2 text-slate-600">
                  Enviaste {presupuesto.numero} por{" "}
                  {formatMoney(presupuesto.total)}. El cliente todavía no respondió.
                </p>
              </div>
            ) : ordenAbierta ? (
              <div className="space-y-3">
                {presupuesto?.estado === "RECHAZADO" && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {presupuesto.numero} fue rechazado.
                    {presupuesto.motivoRechazo
                      ? ` Motivo: ${presupuesto.motivoRechazo}`
                      : ""}{" "}
                    Ajustá los ítems y reenvialo.
                  </div>
                )}
                <p className="text-sm text-slate-500">
                  Enviá el detalle de los ítems al cliente para que lo apruebe.
                </p>
                <EnviarPresupuesto ordenId={orden.id} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No hay presupuesto activo.
              </p>
            )}
          </Card>

          {(orden.estado === "LISTA" ||
            orden.estado === "PAGADA" ||
            orden.estado === "ENTREGADA") && (
            <Card>
              <h2 className="mb-3 font-semibold text-slate-900">Pago</h2>
              {orden.estado === "LISTA" ? (
                <RegistrarPago ordenId={orden.id} total={orden.total.toString()} />
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-green-700">
                    ✅ Pago registrado: {formatMoney(orden.pagos[0]?.monto ?? 0)}
                  </p>
                  {comprobante && (
                    <Link
                      href={`/comprobante/${comprobante.id}`}
                      className="inline-block font-medium text-brand-600 hover:underline"
                    >
                      Ver comprobante {comprobante.numero} →
                    </Link>
                  )}
                </div>
              )}
            </Card>
          )}

          <AccionesOrden ordenId={orden.id} estado={orden.estado} />
        </div>
      </div>

      {/* Conversación con el cliente */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
          Conversación con el cliente
          {(() => {
            const last = orden.mensajes[orden.mensajes.length - 1];
            const sinVer =
              last &&
              last.autorId === orden.clienteId &&
              (!orden.vistoTallerEn || last.creadoEn > orden.vistoTallerEn);
            return sinVer ? (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                Nuevo mensaje
              </span>
            ) : null;
          })()}
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {orden.cliente.nombre} recibe un aviso por cada mensaje.
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

      <p className="text-xs text-slate-400">
        Creada el {formatDate(orden.creadoEn)}
      </p>
    </div>
  );
}
