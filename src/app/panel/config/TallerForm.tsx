"use client";

import { useActionState } from "react";
import { actualizarTaller } from "@/lib/actions/taller";
import { Button, Input, Label } from "@/components/ui";

export default function TallerForm({
  taller,
}: {
  taller: {
    id: string;
    nombre: string;
    descripcion: string;
    direccion: string;
    telefono: string;
    whatsapp: string;
    email: string;
  };
}) {
  const [state, action, pending] = useActionState(actualizarTaller, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tallerId" value={taller.id} />
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" defaultValue={taller.nombre} required />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={taller.descripcion}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" defaultValue={taller.direccion} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefono">Teléfono (para llamar)</Label>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={taller.telefono}
            placeholder="Ej: +54 11 5555-1111"
          />
          <p className="mt-1 text-xs text-slate-400">
            El botón “Llamar” de tu página usa este número.
          </p>
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            defaultValue={taller.whatsapp}
            placeholder="Ej: +54 9 381 535-9505"
          />
          <p className="mt-1 text-xs text-slate-400">
            Usá formato internacional (con +54 y el 9) para que abra bien el chat.
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email de contacto</Label>
        <Input id="email" name="email" type="email" defaultValue={taller.email} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✅ Guardado.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
