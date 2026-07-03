"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crearTallerParaUsuario } from "@/lib/actions/taller";
import { Button, Input, Label } from "@/components/ui";

export default function CrearTallerForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    crearTallerParaUsuario,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) router.push("/panel");
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre del taller</Label>
        <Input id="nombre" name="nombre" required />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="direccion">Dirección</Label>
          <Input id="direccion" name="direccion" />
        </div>
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear taller"}
      </Button>
    </form>
  );
}
