"use client";

import { useState, useTransition } from "react";
import { cambiarRolUsuario } from "@/lib/actions/admin";
import { Select } from "@/components/ui";

export default function CambiarRol({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Select
        defaultValue={role}
        disabled={pending}
        onChange={(e) => {
          const nuevo = e.target.value as "CLIENTE" | "TALLER" | "SUPER_ADMIN";
          if (nuevo === role) return;
          setError(null);
          start(async () => {
            const res = await cambiarRolUsuario(userId, nuevo);
            if (res?.error) {
              setError(res.error);
              e.target.value = role; // revertir el select
            }
          });
        }}
        className="min-w-[8rem] py-1.5 text-xs"
      >
        <option value="CLIENTE">Cliente</option>
        <option value="TALLER">Taller</option>
        <option value="SUPER_ADMIN">Super admin</option>
      </Select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
