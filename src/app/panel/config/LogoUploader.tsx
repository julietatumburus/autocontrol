"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { actualizarLogo, quitarLogo } from "@/lib/actions/taller";
import { comprimirImagen } from "@/lib/imagen";
import { TallerLogo } from "@/components/TallerLogo";
import { Button } from "@/components/ui";

export default function LogoUploader({
  tallerId,
  nombre,
  logoUrl,
}: {
  tallerId: string;
  nombre: string;
  logoUrl: string | null;
}) {
  const [state, action] = useActionState(actualizarLogo, undefined);
  const [pending, startTransition] = useTransition();
  const [removing, startRemove] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [state]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const comprimido = await comprimirImagen(file, {
      maxLado: 256,
      calidad: 0.85,
      tipo: "image/webp",
    });
    const fd = new FormData();
    fd.set("tallerId", tallerId);
    fd.set("logo", comprimido);
    startTransition(() => action(fd));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-5">
      <TallerLogo src={preview ?? logoUrl} nombre={nombre} size={72} />

      <div className="flex-1 space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={onPick}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="text-xs text-slate-400">
          PNG, JPG, WebP o SVG. Se optimiza automáticamente. Cuadrado se ve mejor.
        </p>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-600">✅ Logo actualizado.</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending || !file}>
            {pending ? "Subiendo..." : "Guardar logo"}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={removing}
              onClick={() =>
                startRemove(async () => {
                  await quitarLogo(tallerId);
                  setPreview(null);
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                })
              }
            >
              Quitar
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
