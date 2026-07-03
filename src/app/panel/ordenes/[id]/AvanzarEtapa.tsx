"use client";

import { useState, useTransition } from "react";
import { avanzarEtapa } from "@/lib/actions/ordenes";
import { cn } from "@/lib/utils";

type Etapa = {
  id: string;
  nombre: string;
  color: string;
  esFinal: boolean;
};

export default function AvanzarEtapa({
  ordenId,
  etapaActualId,
  etapas,
}: {
  ordenId: string;
  etapaActualId: string | null;
  etapas: Etapa[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function mover(etapaId: string) {
    setError(null);
    startTransition(async () => {
      const res = await avanzarEtapa(ordenId, etapaId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {etapas.map((e) => {
          const actual = e.id === etapaActualId;
          return (
            <button
              key={e.id}
              disabled={pending || actual}
              onClick={() => mover(e.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                actual
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: e.color }}
              />
              {e.nombre}
              {e.esFinal && " 🏁"}
              {actual && " (actual)"}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
