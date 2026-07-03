"use client";

import { useActionState } from "react";
import { actualizarGarantia } from "@/lib/actions/taller";
import { Button, Label, Select } from "@/components/ui";

export default function GarantiaConfig({
  taller,
}: {
  taller: { id: string; garantiaActiva: boolean; garantiaMeses: number };
}) {
  const [state, action, pending] = useActionState(actualizarGarantia, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tallerId" value={taller.id} />

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="garantiaActiva"
          defaultChecked={taller.garantiaActiva}
          className="h-4 w-4 rounded border-slate-300"
        />
        Ofrezco garantía sobre el trabajo entregado
      </label>

      <div className="max-w-xs">
        <Label htmlFor="garantiaMeses">Duración de la garantía</Label>
        <Select
          id="garantiaMeses"
          name="garantiaMeses"
          defaultValue={String(taller.garantiaMeses)}
        >
          <option value="3">3 meses</option>
          <option value="6">6 meses</option>
          <option value="12">12 meses (1 año)</option>
          <option value="24">24 meses (2 años)</option>
          <option value="36">36 meses (3 años)</option>
        </Select>
      </div>

      <p className="text-xs text-slate-400">
        Cuando una orden pasa a <strong>Entregada</strong>, se muestra el
        distintivo de garantía con el tiempo que corre desde la entrega.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✅ Garantía actualizada.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar garantía"}
      </Button>
    </form>
  );
}
