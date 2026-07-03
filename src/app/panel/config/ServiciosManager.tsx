"use client";

import { useActionState, useRef, useTransition } from "react";
import { agregarServicio, eliminarServicio } from "@/lib/actions/taller";
import { Button, Input } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

type Servicio = {
  id: string;
  nombre: string;
  descripcion: string;
  precioDesde: string | null;
};

export default function ServiciosManager({
  tallerId,
  servicios,
  editable,
}: {
  tallerId: string;
  servicios: Servicio[];
  editable: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(agregarServicio, undefined);
  const [deleting, startDelete] = useTransition();

  if (state?.ok) formRef.current?.reset();

  return (
    <div className="space-y-4">
      {servicios.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no cargaste servicios.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {servicios.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{s.nombre}</p>
                {s.descripcion && (
                  <p className="text-xs text-slate-400">{s.descripcion}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {s.precioDesde && (
                  <span className="text-sm text-brand-600">
                    desde {formatMoney(s.precioDesde)}
                  </span>
                )}
                {editable && (
                  <button
                    disabled={deleting}
                    onClick={() =>
                      startDelete(async () => {
                        await eliminarServicio(s.id);
                      })
                    }
                    className="text-slate-300 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form
          ref={formRef}
          action={action}
          className="space-y-2 rounded-lg bg-slate-50 p-3"
        >
          <input type="hidden" name="tallerId" value={tallerId} />
          <Input name="nombre" placeholder="Nombre del servicio" required />
          <Input name="descripcion" placeholder="Descripción (opcional)" />
          <Input
            name="precioDesde"
            type="number"
            step="0.01"
            placeholder="Precio desde (opcional)"
          />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Agregando..." : "+ Agregar servicio"}
          </Button>
        </form>
      )}
    </div>
  );
}
