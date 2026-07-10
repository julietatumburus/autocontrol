"use client";

import { useState, useTransition } from "react";
import { eliminarUsuario } from "@/lib/actions/admin";

export default function EliminarUsuario({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function borrar() {
    if (
      !confirm(
        `¿Eliminar DEFINITIVAMENTE la cuenta ${email} y todos sus datos? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await eliminarUsuario(userId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={borrar}
        disabled={pending}
        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
