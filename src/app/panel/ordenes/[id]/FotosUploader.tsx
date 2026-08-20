"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { subirFotos } from "@/lib/actions/fotos";
import { comprimirImagen } from "@/lib/imagen";
import { Button, Input, Select, Label } from "@/components/ui";

export default function FotosUploader({
  ordenId,
  etapas,
  etapaActual,
}: {
  ordenId: string;
  etapas: string[];
  etapaActual: string | null;
}) {
  const [state, action] = useActionState(subirFotos, undefined);
  const [pending, startTransition] = useTransition();
  const [comprimiendo, setComprimiendo] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [etapa, setEtapa] = useState(etapaActual ?? etapas[0] ?? "");
  const [descripcion, setDescripcion] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setFiles([]);
      setDescripcion("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [state]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setComprimiendo(true);
    const comprimidas = await Promise.all(
      files.map((f) => comprimirImagen(f, { maxLado: 1280, calidad: 0.72 })),
    );
    setComprimiendo(false);
    const fd = new FormData();
    fd.set("ordenId", ordenId);
    fd.set("etapaNombre", etapa);
    fd.set("descripcion", descripcion);
    for (const f of comprimidas) fd.append("fotos", f);
    startTransition(() => action(fd));
  }

  const busy = pending || comprimiendo;

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg bg-slate-50 p-3">
      <div>
        <Label htmlFor="etapaNombre">Etapa</Label>
        <Select
          id="etapaNombre"
          value={etapa}
          onChange={(e) => setEtapa(e.target.value)}
        >
          {etapas.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
      />
      <Input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
        maxLength={120}
      />
      <p className="text-xs text-slate-400">
        Las fotos se optimizan en tu dispositivo antes de subirse: más rápido y
        mucho más liviano para el cliente.
      </p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✅ Fotos subidas.</p>}
      <Button
        type="submit"
        variant="secondary"
        disabled={busy || files.length === 0}
        className="w-full"
      >
        {comprimiendo
          ? "Optimizando..."
          : pending
            ? "Subiendo..."
            : files.length > 0
              ? `Subir ${files.length} foto${files.length > 1 ? "s" : ""}`
              : "Elegí fotos para subir"}
      </Button>
    </form>
  );
}
