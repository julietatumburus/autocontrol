"use client";

import { useTransition } from "react";
import { cambiarEstadoTaller } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export default function TallerAcciones({
  tallerId,
  estado,
}: {
  tallerId: string;
  estado: string;
}) {
  const [pending, startTransition] = useTransition();

  function set(nuevo: "ACTIVO" | "SUSPENDIDO" | "PENDIENTE") {
    startTransition(async () => {
      await cambiarEstadoTaller(tallerId, nuevo);
    });
  }

  const btn =
    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50";

  return (
    <div className="flex justify-end gap-2">
      {estado !== "ACTIVO" && (
        <button
          disabled={pending}
          onClick={() => set("ACTIVO")}
          className={cn(btn, "bg-green-600 text-white hover:bg-green-700")}
        >
          Activar
        </button>
      )}
      {estado !== "SUSPENDIDO" && (
        <button
          disabled={pending}
          onClick={() => set("SUSPENDIDO")}
          className={cn(btn, "bg-slate-200 text-slate-700 hover:bg-slate-300")}
        >
          Suspender
        </button>
      )}
    </div>
  );
}
