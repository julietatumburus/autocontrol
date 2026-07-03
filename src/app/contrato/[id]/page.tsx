import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/Logo";
import PresupuestoDetalle, {
  type PresupuestoItem,
} from "@/components/PresupuestoDetalle";
import PrintClient from "@/app/comprobante/[id]/PrintClient";

export const dynamic = "force-dynamic";

export default async function ContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pres = await prisma.presupuesto.findUnique({
    where: { id },
    include: {
      orden: { include: { taller: true, cliente: true, vehiculo: true } },
    },
  });
  if (!pres) notFound();

  // Autorización: cliente dueño, staff del taller, o super admin
  const esCliente = pres.orden.clienteId === session.user.id;
  const esSuper = session.user.role === "SUPER_ADMIN";
  let esStaff = false;
  if (!esCliente && !esSuper) {
    const member = await prisma.tallerMember.findUnique({
      where: {
        userId_tallerId: {
          userId: session.user.id,
          tallerId: pres.orden.tallerId,
        },
      },
    });
    esStaff = !!member;
  }
  if (!esCliente && !esSuper && !esStaff) notFound();

  const detalle = pres.detalle as { items: PresupuestoItem[]; total: string };
  const aprobado = pres.estado === "APROBADO";

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <a href="/mi-cuenta" className="text-sm text-brand-600 hover:underline">
            ← Volver
          </a>
          <PrintClient />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          {/* Encabezado */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <LogoMark size={28} /> Autocontrol
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Contrato de presupuesto
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Presupuesto</p>
              <p className="font-bold text-slate-900">{pres.numero}</p>
              <p className="text-xs text-slate-400">
                Enviado {formatDate(pres.enviadoEn)}
              </p>
            </div>
          </div>

          {!aprobado && (
            <div className="mt-6 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
              {pres.estado === "ENVIADO"
                ? "Este presupuesto todavía no fue aprobado por el cliente."
                : "Este presupuesto fue rechazado por el cliente."}
            </div>
          )}

          {/* Datos */}
          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Taller
              </p>
              <p className="text-slate-800">{pres.orden.taller.nombre}</p>
              {pres.orden.taller.direccion && (
                <p className="text-sm text-slate-500">
                  {pres.orden.taller.direccion}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Cliente
              </p>
              <p className="text-slate-800">{pres.orden.cliente.nombre}</p>
              <p className="text-sm text-slate-500">{pres.orden.cliente.email}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Vehículo
              </p>
              <p className="text-slate-800">
                {pres.orden.vehiculo.marca} {pres.orden.vehiculo.modelo} ·{" "}
                {pres.orden.vehiculo.patente} · Orden #{pres.orden.numero}
              </p>
            </div>
          </div>

          {/* Detalle */}
          <PresupuestoDetalle items={detalle.items} total={detalle.total} />

          {pres.nota && (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold">Nota del taller:</span> {pres.nota}
            </p>
          )}

          {/* Firmas */}
          <div className="mt-10 grid grid-cols-2 gap-8">
            <div className="border-t-2 border-slate-300 pt-2 text-center">
              <p className="font-medium text-slate-800">{pres.clienteNombre}</p>
              <p className="text-xs text-slate-400">
                Cliente {aprobado ? "— Aprobado" : ""}
              </p>
            </div>
            <div className="border-t-2 border-slate-300 pt-2 text-center">
              <p className="font-medium text-slate-800">{pres.tallerNombre}</p>
              <p className="text-xs text-slate-400">Taller</p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            {aprobado && pres.respondidoEn
              ? `Aprobado digitalmente por ${pres.clienteNombre} el ${formatDate(pres.respondidoEn)} vía Autocontrol.`
              : "Documento generado por Autocontrol."}
          </p>
        </div>
      </div>
    </div>
  );
}
