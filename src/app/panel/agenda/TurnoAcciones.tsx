"use client";

import { useTransition } from "react";
import { cambiarEstadoTurno } from "@/lib/actions/turnos";
import { Button } from "@/components/ui";

export default function TurnoAcciones({
  turnoId,
  estado,
}: {
  turnoId: string;
  estado: string;
}) {
  const [pending, start] = useTransition();

  function set(e: "CONFIRMADO" | "CANCELADO" | "COMPLETADO") {
    start(async () => {
      await cambiarEstadoTurno(turnoId, e);
    });
  }

  if (estado === "CANCELADO" || estado === "COMPLETADO") return null;

  return (
    <div className="flex gap-2">
      {estado === "SOLICITADO" && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => set("CONFIRMADO")}
          className="px-3 py-1.5"
        >
          Confirmar
        </Button>
      )}
      {estado === "CONFIRMADO" && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => set("COMPLETADO")}
          className="px-3 py-1.5"
        >
          Completado
        </Button>
      )}
      <button
        disabled={pending}
        onClick={() => set("CANCELADO")}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
      >
        Cancelar
      </button>
    </div>
  );
}
