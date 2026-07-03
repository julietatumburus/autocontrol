"use client";

import { useActionState, useRef, useTransition } from "react";
import { agregarItem, eliminarItem } from "@/lib/actions/ordenes";
import { Button, Input, Select } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

type Item = {
  id: string;
  tipo: string;
  nombre: string;
  cantidad: string;
  precioUnitario: string;
};

const TIPO_LABEL: Record<string, string> = {
  REPUESTO: "Repuesto",
  PRODUCTO: "Producto",
  MANO_OBRA: "Mano de obra",
};

export default function ItemsManager({
  ordenId,
  items,
  total,
  editable,
}: {
  ordenId: string;
  items: Item[];
  total: string;
  editable: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(agregarItem, undefined);
  const [deleting, startDelete] = useTransition();

  if (state?.ok) formRef.current?.reset();

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin ítems cargados.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => {
            const subtotal = Number(it.cantidad) * Number(it.precioUnitario);
            return (
              <li key={it.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {it.nombre}
                  </p>
                  <p className="text-xs text-slate-400">
                    {TIPO_LABEL[it.tipo]} · {it.cantidad} ×{" "}
                    {formatMoney(it.precioUnitario)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {formatMoney(subtotal)}
                  </span>
                  {editable && (
                    <button
                      disabled={deleting}
                      onClick={() =>
                        startDelete(async () => {
                          await eliminarItem(it.id);
                        })
                      }
                      className="text-slate-300 hover:text-red-500"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="text-sm font-semibold text-slate-600">Total</span>
        <span className="text-lg font-bold text-slate-900">
          {formatMoney(total)}
        </span>
      </div>

      {editable && (
        <form
          ref={formRef}
          action={action}
          className="space-y-2 rounded-lg bg-slate-50 p-3"
        >
          <input type="hidden" name="ordenId" value={ordenId} />
          <Input name="nombre" placeholder="Ej: Pastillas de freno" required />
          <div className="grid grid-cols-2 gap-2">
            <Select name="tipo" defaultValue="REPUESTO">
              <option value="REPUESTO">Repuesto</option>
              <option value="PRODUCTO">Producto</option>
              <option value="MANO_OBRA">Mano de obra</option>
            </Select>
            <Input
              name="cantidad"
              type="number"
              step="0.01"
              defaultValue="1"
              placeholder="Cant."
              required
            />
          </div>
          <Input
            name="precioUnitario"
            type="number"
            step="0.01"
            placeholder="Precio unitario"
            required
          />
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" variant="secondary" disabled={pending} className="w-full">
            {pending ? "Agregando..." : "+ Agregar ítem"}
          </Button>
        </form>
      )}
    </div>
  );
}
