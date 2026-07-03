"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Banner para instalar Autocontrol en el teléfono (Android/Chrome e iOS). */
export default function InstallPWA() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return;

    // ¿Ya está instalada?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|chrome/i.test(ua);

    if (isIos && isSafari) {
      setIos(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem("pwa-dismissed", "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-900/10">
      <div className="flex items-start gap-3">
        <LogoMark size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">
            Instalá Autocontrol
          </p>
          {ios ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              Tocá el botón <span className="font-medium">Compartir</span> y luego{" "}
              <span className="font-medium">“Agregar a inicio”</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-500">
              Accedé más rápido desde tu teléfono, como una app.
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          ✕
        </button>
      </div>

      {!ios && (
        <button
          onClick={install}
          className="mt-3 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Instalar app
        </button>
      )}
    </div>
  );
}
