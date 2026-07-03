"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  agregarEtapa,
  actualizarEtapa,
  moverEtapa,
  eliminarEtapa,
} from "@/lib/actions/etapas";
import { Button, Input } from "@/components/ui";

type Etapa = {
  id: string;
  nombre: string;
  color: string;
  orden: number;
  esFinal: boolean;
};

export default function EtapasManager({
  tallerId,
  etapas,
  editable,
}: {
  tallerId: string;
  etapas: Etapa[];
  editable: boolean;
}) {
  if (!editable) {
    return (
      <ol className="space-y-2">
        {etapas.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs text-slate-400">{e.orden}</span>
            <span className="h-3 w-3 rounded-full" style={{ background: e.color }} />
            <span className="font-medium text-slate-700">{e.nombre}</span>
            {e.esFinal && <span className="text-xs text-slate-400">🏁 final</span>}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {etapas.map((e, i) => (
          <EtapaRow
            key={e.id}
            etapa={e}
            isFirst={i === 0}
            isLast={i === etapas.length - 1}
          />
        ))}
      </div>

      <AgregarEtapaForm tallerId={tallerId} />

      <p className="text-xs text-slate-400">
        🏁 La etapa <strong>final</strong> marca el auto como “Listo para retirar”
        y dispara el aviso al cliente. Solo puede haber una.
      </p>
    </div>
  );
}

function EtapaRow({
  etapa,
  isFirst,
  isLast,
}: {
  etapa: Etapa;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [nombre, setNombre] = useState(etapa.nombre);
  const [color, setColor] = useState(etapa.color);
  const [esFinal, setEsFinal] = useState(etapa.esFinal);
  const [base, setBase] = useState({
    nombre: etapa.nombre,
    color: etapa.color,
    esFinal: etapa.esFinal,
  });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dirty =
    nombre !== base.nombre || color !== base.color || esFinal !== base.esFinal;

  function guardar() {
    setError(null);
    start(async () => {
      const res = await actualizarEtapa(etapa.id, nombre, color, esFinal);
      if (res?.error) setError(res.error);
      else setBase({ nombre, color, esFinal });
    });
  }

  function mover(dir: "subir" | "bajar") {
    setError(null);
    start(async () => {
      await moverEtapa(etapa.id, dir);
    });
  }

  function eliminar() {
    setError(null);
    start(async () => {
      const res = await eliminarEtapa(etapa.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* Reordenar */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => mover("subir")}
            disabled={isFirst || pending}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
            title="Subir"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => mover("bajar")}
            disabled={isLast || pending}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
            title="Bajar"
          >
            ▼
          </button>
        </div>

        {/* Color */}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
          title="Color de la etapa"
        />

        {/* Nombre */}
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={40}
          className="min-w-0 flex-1"
        />

        {/* Final */}
        <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
          <input
            type="checkbox"
            checked={esFinal}
            onChange={(e) => setEsFinal(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Final 🏁
        </label>

        {/* Guardar (solo si hay cambios) */}
        {dirty && (
          <Button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="px-3 py-1.5"
          >
            {pending ? "..." : "Guardar"}
          </Button>
        )}

        {/* Eliminar */}
        <button
          type="button"
          onClick={eliminar}
          disabled={pending}
          className="rounded p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
          title="Eliminar etapa"
        >
          🗑
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function AgregarEtapaForm({ tallerId }: { tallerId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(agregarEtapa, undefined);

  if (state?.ok) formRef.current?.reset();

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2.5"
    >
      <input type="hidden" name="tallerId" value={tallerId} />
      <input
        type="color"
        name="color"
        defaultValue="#3b82f6"
        className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
        title="Color"
      />
      <Input
        name="nombre"
        placeholder="Nueva etapa (ej: Lavado)"
        maxLength={40}
        required
        className="min-w-0 flex-1"
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Agregando..." : "+ Agregar etapa"}
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
