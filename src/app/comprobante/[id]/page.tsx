import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import PrintClient from "./PrintClient";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

const METODO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
};

type DetalleItem = {
  nombre: string;
  tipo: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: string;
};

export default async function ComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const comprobante = await prisma.comprobante.findUnique({
    where: { id },
    include: {
      orden: { include: { taller: true, cliente: true, vehiculo: true } },
      pago: true,
    },
  });
  if (!comprobante) notFound();

  // Autorización: cliente dueño, staff del taller, o super admin
  const esCliente = comprobante.orden.clienteId === session.user.id;
  const esSuper = session.user.role === "SUPER_ADMIN";
  let esStaff = false;
  if (!esCliente && !esSuper) {
    const member = await prisma.tallerMember.findUnique({
      where: {
        userId_tallerId: {
          userId: session.user.id,
          tallerId: comprobante.orden.tallerId,
        },
      },
    });
    esStaff = !!member;
  }
  if (!esCliente && !esSuper && !esStaff) notFound();

  const detalle = comprobante.detalle as {
    items?: DetalleItem[];
  };
  const items = detalle.items ?? [];

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
              <p className="mt-1 text-sm text-slate-500">Detalle de servicio</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Comprobante</p>
              <p className="font-bold text-slate-900">{comprobante.numero}</p>
              <p className="text-xs text-slate-400">
                {formatDate(comprobante.emitidoEn)}
              </p>
            </div>
          </div>

          {/* Datos */}
          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Taller</p>
              <p className="text-slate-800">{comprobante.orden.taller.nombre}</p>
              {comprobante.orden.taller.direccion && (
                <p className="text-sm text-slate-500">
                  {comprobante.orden.taller.direccion}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Cliente</p>
              <p className="text-slate-800">{comprobante.orden.cliente.nombre}</p>
              <p className="text-sm text-slate-500">
                {comprobante.orden.cliente.email}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-slate-400">Vehículo</p>
              <p className="text-slate-800">
                {comprobante.orden.vehiculo.marca}{" "}
                {comprobante.orden.vehiculo.modelo} ·{" "}
                {comprobante.orden.vehiculo.patente} · Orden #
                {comprobante.orden.numero}
              </p>
            </div>
          </div>

          {/* Ítems */}
          <table className="w-full border-t border-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="py-2">Detalle</th>
                <th className="py-2 text-center">Cant.</th>
                <th className="py-2 text-right">P. unit.</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2 text-slate-700">{it.nombre}</td>
                  <td className="py-2 text-center text-slate-500">
                    {it.cantidad}
                  </td>
                  <td className="py-2 text-right text-slate-500">
                    {formatMoney(it.precioUnitario)}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-700">
                    {formatMoney(it.subtotal)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-400">
                    Sin ítems detallados
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-6 flex flex-col items-end gap-1 border-t border-slate-200 pt-4">
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-slate-500">Método de pago</span>
              <span className="text-slate-700">
                {METODO_LABEL[comprobante.pago.metodo]}
              </span>
            </div>
            <div className="flex w-full max-w-xs justify-between">
              <span className="font-semibold text-slate-900">Total pagado</span>
              <span className="text-xl font-bold text-slate-900">
                {formatMoney(comprobante.total)}
              </span>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Gracias por confiar en {comprobante.orden.taller.nombre} · Emitido vía
            Autocontrol
          </p>
        </div>
      </div>
    </div>
  );
}
