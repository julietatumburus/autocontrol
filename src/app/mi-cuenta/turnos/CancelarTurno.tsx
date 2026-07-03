"use client";

import { useTransition } from "react";
import { cancelarMiTurno } from "@/lib/actions/turnos";

export default function CancelarTurno({ turnoId }: { turnoId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => void (await cancelarMiTurno(turnoId)))}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "Cancelando..." : "Cancelar"}
    </button>
  );
}
