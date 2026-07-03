"use client";

import { useActionState } from "react";
import { registrarPago } from "@/lib/actions/ordenes";
import { Button, Input, Select, Label } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

export default function RegistrarPago({
  ordenId,
  total,
}: {
  ordenId: string;
  total: string;
}) {
  const [state, action, pending] = useActionState(registrarPago, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ordenId" value={ordenId} />
      <p className="text-sm text-slate-500">
        El cliente abona en el taller. Al registrar el pago se emite el
        comprobante y se le avisa.
      </p>
      <div>
        <Label htmlFor="monto">Monto cobrado</Label>
        <Input
          id="monto"
          name="monto"
          type="number"
          step="0.01"
          defaultValue={total}
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          Total de la orden: {formatMoney(total)}
        </p>
      </div>
      <div>
        <Label htmlFor="metodo">Método</Label>
        <Select id="metodo" name="metodo" defaultValue="EFECTIVO">
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="OTRO">Otro</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="nota">Nota (opcional)</Label>
        <Input id="nota" name="nota" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Registrando..." : "Registrar pago y emitir comprobante"}
      </Button>
    </form>
  );
}
