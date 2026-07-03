"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { actualizarLogo, quitarLogo } from "@/lib/actions/taller";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, action, pending] = useActionState(actualizarLogo, undefined);
  const [removing, startRemove] = useTransition();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-5">
      <input type="hidden" name="tallerId" value={tallerId} />
      <TallerLogo src={preview ?? logoUrl} nombre={nombre} size={72} />

      <div className="flex-1 space-y-2">
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={onPick}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="text-xs text-slate-400">
          PNG, JPG, WebP o SVG. Máximo 1 MB. Cuadrado se ve mejor.
        </p>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-600">✅ Logo actualizado.</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
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
                  formRef.current?.reset();
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
