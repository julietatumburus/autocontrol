"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { editarOrden } from "@/lib/actions/ordenes";
import { Card, Button, Input, Label } from "@/components/ui";

type Datos = {
  ordenId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  marca: string;
  modelo: string;
  anio: string;
  patente: string;
  color: string;
  descripcionProblema: string;
};

/**
 * Corrige los datos cargados al abrir la orden. Arranca plegado para no
 * competir con el flujo normal del taller (avanzar etapas, cargar repuestos):
 * editar es la excepción, no lo que se hace todos los días.
 */
export default function EditarOrden({
  datos,
  puedeCambiarCliente,
}: {
  datos: Datos;
  puedeCambiarCliente: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [state, action, pending] = useActionState(editarOrden, undefined);
  const [email, setEmail] = useState(datos.clienteEmail);

  useEffect(() => {
    if (state?.ok) {
      setAbierto(false);
      router.refresh();
    }
  }, [state, router]);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Editar datos
      </button>
    );
  }

  const cambiaCliente = email.toLowerCase() !== datos.clienteEmail.toLowerCase();

  return (
    <Card className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Editar datos de la orden</h2>
        <button
          onClick={() => setAbierto(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancelar
        </button>
      </div>

      <form action={action} className="space-y-5">
        <input type="hidden" name="ordenId" value={datos.ordenId} />

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase text-slate-400">
            Cliente
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="clienteNombre">Nombre</Label>
              <Input
                id="clienteNombre"
                name="clienteNombre"
                defaultValue={datos.clienteNombre}
                required
              />
            </div>
            <div>
              <Label htmlFor="clienteTelefono">Teléfono</Label>
              <Input
                id="clienteTelefono"
                name="clienteTelefono"
                defaultValue={datos.clienteTelefono}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clienteEmail">Email</Label>
            <Input
              id="clienteEmail"
              name="clienteEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!puedeCambiarCliente}
              required
            />
            {!puedeCambiarCliente ? (
              <p className="mt-1 text-xs text-slate-500">
                La orden ya fue cobrada: el cliente no se puede cambiar.
              </p>
            ) : cambiaCliente ? (
              <p className="mt-1 text-xs text-amber-700">
                Vas a pasar esta orden a la cuenta <strong>{email}</strong>. El
                cliente actual deja de verla. Si esa cuenta no existe, se crea y
                le llega un email para definir su contraseña.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Cambiarlo reasigna la orden a otra cuenta. No modifica el email
                del cliente actual.
              </p>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase text-slate-400">
            Vehículo
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" name="marca" defaultValue={datos.marca} required />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" name="modelo" defaultValue={datos.modelo} required />
            </div>
            <div>
              <Label htmlFor="patente">Patente</Label>
              <Input
                id="patente"
                name="patente"
                defaultValue={datos.patente}
                className="uppercase"
                required
              />
            </div>
            <div>
              <Label htmlFor="anio">Año</Label>
              <Input
                id="anio"
                name="anio"
                type="number"
                defaultValue={datos.anio}
                placeholder="Ej: 2021"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" defaultValue={datos.color} />
            </div>
          </div>
        </fieldset>

        <div>
          <Label htmlFor="descripcionProblema">Problema reportado</Label>
          <textarea
            id="descripcionProblema"
            name="descripcionProblema"
            defaultValue={datos.descripcionProblema}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
