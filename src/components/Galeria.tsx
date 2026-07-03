"use client";

import { useState, useTransition } from "react";
import { eliminarFoto } from "@/lib/actions/fotos";
import { formatDate } from "@/lib/utils";

export type Foto = {
  id: string;
  url: string;
  descripcion: string | null;
  etapaNombre: string | null;
  creadoEn: string | Date;
};

export default function Galeria({
  fotos,
  editable = false,
}: {
  fotos: Foto[];
  editable?: boolean;
}) {
  const [abierta, setAbierta] = useState<Foto | null>(null);
  const [borrando, start] = useTransition();

  if (fotos.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Todavía no hay fotos del avance.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {fotos.map((f) => (
          <div key={f.id} className="group relative aspect-square">
            <button
              type="button"
              onClick={() => setAbierta(f)}
              className="h-full w-full overflow-hidden rounded-lg border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.descripcion ?? "Foto del avance"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
            {editable && (
              <button
                type="button"
                disabled={borrando}
                onClick={() =>
                  start(async () => {
                    await eliminarFoto(f.id);
                  })
                }
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-red-600 group-hover:flex"
                title="Eliminar foto"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAbierta(null)}
        >
          <div
            className="max-h-[90vh] max-w-3xl overflow-hidden rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={abierta.url}
              alt={abierta.descripcion ?? "Foto"}
              className="max-h-[75vh] w-full object-contain"
            />
            <div className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                {abierta.etapaNombre && (
                  <span className="font-medium text-slate-700">
                    {abierta.etapaNombre}
                  </span>
                )}
                {abierta.descripcion && (
                  <span className="text-slate-500"> · {abierta.descripcion}</span>
                )}
                <span className="block text-xs text-slate-400">
                  {formatDate(abierta.creadoEn)}
                </span>
              </div>
              <button
                onClick={() => setAbierta(null)}
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
