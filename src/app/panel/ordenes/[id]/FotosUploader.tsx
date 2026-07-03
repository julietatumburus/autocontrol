"use client";

import { useActionState, useRef, useState } from "react";
import { subirFotos } from "@/lib/actions/fotos";
import { Button, Input, Select, Label } from "@/components/ui";

export default function FotosUploader({
  ordenId,
  etapas,
  etapaActual,
}: {
  ordenId: string;
  etapas: string[];
  etapaActual: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [count, setCount] = useState(0);
  const [state, action, pending] = useActionState(subirFotos, undefined);

  if (state?.ok && count !== 0) {
    formRef.current?.reset();
    setCount(0);
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-2 rounded-lg bg-slate-50 p-3"
    >
      <input type="hidden" name="ordenId" value={ordenId} />
      <div>
        <Label htmlFor="etapaNombre">Etapa</Label>
        <Select
          id="etapaNombre"
          name="etapaNombre"
          defaultValue={etapaActual ?? etapas[0] ?? ""}
        >
          {etapas.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </div>
      <input
        type="file"
        name="fotos"
        accept="image/*"
        multiple
        onChange={(e) => setCount(e.target.files?.length ?? 0)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
      />
      <Input name="descripcion" placeholder="Descripción (opcional)" maxLength={120} />
      <p className="text-xs text-slate-400">
        Hasta 4 MB por foto. Se cargan en la etapa elegida y el cliente recibe un
        aviso.
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-green-600">✅ Fotos subidas.</p>
      )}
      <Button type="submit" variant="secondary" disabled={pending || count === 0} className="w-full">
        {pending
          ? "Subiendo..."
          : count > 0
            ? `Subir ${count} foto${count > 1 ? "s" : ""}`
            : "Elegí fotos para subir"}
      </Button>
    </form>
  );
}
