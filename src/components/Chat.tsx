"use client";

import { useActionState, useEffect, useRef } from "react";
import { enviarMensaje } from "@/lib/actions/mensajes";
import { Button } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";

export type ChatMensaje = {
  id: string;
  cuerpo: string;
  creadoEn: string | Date;
  autorNombre: string;
  mine: boolean;
};

export default function Chat({
  ordenId,
  mensajes,
}: {
  ordenId: string;
  mensajes: ChatMensaje[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState(enviarMensaje, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    // Scrollea SOLO el contenedor del chat (no la página) hacia el último mensaje
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length]);

  return (
    <div className="space-y-3">
      <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {mensajes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Todavía no hay mensajes. Escribí el primero 👇
          </p>
        ) : (
          mensajes.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.mine
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-800",
                )}
              >
                {m.cuerpo}
              </div>
              <span className="mt-1 text-[11px] text-slate-400">
                {m.mine ? "Vos" : m.autorNombre} · {formatDate(m.creadoEn)}
              </span>
            </div>
          ))
        )}
      </div>

      <form ref={formRef} action={action} className="flex items-end gap-2">
        <input type="hidden" name="ordenId" value={ordenId} />
        <textarea
          name="cuerpo"
          rows={2}
          required
          maxLength={2000}
          placeholder="Escribí un mensaje..."
          className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Enviar"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
