import { formatMoney } from "@/lib/utils";

export type PresupuestoItem = {
  nombre: string;
  tipo: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: string;
};

const TIPO_LABEL: Record<string, string> = {
  REPUESTO: "Repuesto",
  PRODUCTO: "Producto",
  MANO_OBRA: "Mano de obra",
};

export default function PresupuestoDetalle({
  items,
  total,
}: {
  items: PresupuestoItem[];
  total: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Detalle</th>
            <th className="px-3 py-2 text-center">Cant.</th>
            <th className="px-3 py-2 text-right">P. unit.</th>
            <th className="px-3 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((it, i) => (
            <tr key={i}>
              <td className="px-3 py-2">
                <span className="font-medium text-slate-800">{it.nombre}</span>
                <span className="block text-xs text-slate-400">
                  {TIPO_LABEL[it.tipo] ?? it.tipo}
                </span>
              </td>
              <td className="px-3 py-2 text-center text-slate-600">
                {Number(it.cantidad)}
              </td>
              <td className="px-3 py-2 text-right text-slate-600">
                {formatMoney(it.precioUnitario)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-slate-700">
                {formatMoney(it.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td colSpan={3} className="px-3 py-2 text-right font-semibold text-slate-600">
              Total
            </td>
            <td className="px-3 py-2 text-right text-base font-bold text-slate-900">
              {formatMoney(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
