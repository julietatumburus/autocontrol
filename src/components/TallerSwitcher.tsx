"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { elegirTaller } from "@/lib/actions/taller";

type Opcion = { id: string; nombre: string };

/**
 * Selector de taller activo. Solo se muestra a quien es staff de más de uno.
 */
export default function TallerSwitcher({
  talleres,
  activoId,
}: {
  talleres: Opcion[];
  activoId: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Taller activo</span>
      <select
        value={activoId}
        disabled={pendiente}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await elegirTaller(id);
            router.refresh();
          });
        }}
        className="max-w-[10rem] truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
      >
        {talleres.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
