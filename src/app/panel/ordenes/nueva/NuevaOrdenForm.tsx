"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crearOrden } from "@/lib/actions/ordenes";
import { Button, Input, Label } from "@/components/ui";

export default function NuevaOrdenForm({ tallerId }: { tallerId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(crearOrden, undefined);

  useEffect(() => {
    if (state?.ok && !state.mensaje) router.push("/panel/ordenes");
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="tallerId" value={tallerId} />

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Cliente</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="clienteNombre">Nombre</Label>
            <Input id="clienteNombre" name="clienteNombre" required />
          </div>
          <div>
            <Label htmlFor="clienteEmail">Email</Label>
            <Input id="clienteEmail" name="clienteEmail" type="email" required />
          </div>
          <div>
            <Label htmlFor="clienteTelefono">Teléfono</Label>
            <Input id="clienteTelefono" name="clienteTelefono" />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Si el email ya tiene cuenta, se usa esa. Si no, se crea una cuenta de
          cliente con contraseña temporal.
        </p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Vehículo</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="marca">Marca</Label>
            <Input id="marca" name="marca" required />
          </div>
          <div>
            <Label htmlFor="modelo">Modelo</Label>
            <Input id="modelo" name="modelo" required />
          </div>
          <div>
            <Label htmlFor="anio">Año</Label>
            <Input id="anio" name="anio" type="number" />
          </div>
          <div>
            <Label htmlFor="patente">Patente</Label>
            <Input id="patente" name="patente" required />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Problema</legend>
        <div>
          <Label htmlFor="descripcionProblema">Descripción</Label>
          <textarea
            id="descripcionProblema"
            name="descripcionProblema"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && state.mensaje && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ Orden creada. {state.mensaje}{" "}
          <a href="/panel/ordenes" className="font-medium underline">
            Ver órdenes
          </a>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <a
          href="/panel/ordenes"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </a>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear orden"}
        </Button>
      </div>
    </form>
  );
}
