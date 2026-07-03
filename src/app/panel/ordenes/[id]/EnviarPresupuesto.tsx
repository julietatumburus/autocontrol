"use client";

import { useActionState } from "react";
import { enviarPresupuesto } from "@/lib/actions/presupuesto";
import { Button } from "@/components/ui";

export default function EnviarPresupuesto({ ordenId }: { ordenId: string }) {
  const [state, action, pending] = useActionState(enviarPresupuesto, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="ordenId" value={ordenId} />
      <textarea
        name="nota"
        rows={2}
        placeholder="Nota para el cliente (opcional)"
        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar presupuesto al cliente"}
      </Button>
    </form>
  );
}
