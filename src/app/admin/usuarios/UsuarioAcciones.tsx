"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoUsuario } from "@/lib/actions/admin";

export default function UsuarioAcciones({
  userId,
  activo,
}: {
  userId: string;
  activo: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (activo && !confirm("¿Dar de baja esta cuenta? No podrá volver a ingresar.")) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await cambiarEstadoUsuario(userId, !activo);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={pending}
        className={
          activo
            ? "rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            : "rounded-lg px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
        }
      >
        {pending ? "..." : activo ? "Dar de baja" : "Reactivar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
