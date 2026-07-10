"use client";

import { useState, useTransition } from "react";
import { cambiarRolUsuario } from "@/lib/actions/admin";

export default function SuperAdminToggle({
  userId,
  esSuper,
}: {
  userId: string;
  esSuper: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (
      !esSuper &&
      !confirm(
        "¿Hacer a este usuario SUPER ADMIN? Tendrá acceso total a la plataforma.",
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await cambiarRolUsuario(userId, esSuper ? "CLIENTE" : "SUPER_ADMIN");
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={toggle}
        disabled={pending}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-50"
      >
        {pending ? "..." : esSuper ? "Quitar super admin" : "Hacer super admin"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
