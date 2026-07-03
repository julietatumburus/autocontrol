"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui";
import {
  ShareIcon,
  WhatsAppIcon,
  MailIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
} from "@/components/icons";

export default function CompartirTaller({
  path,
  nombre,
  variant = "secondary",
}: {
  path: string; // ej: /talleres/mi-taller
  nombre: string;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.origin + path);
  }, [path]);

  const mensaje = `Seguí la reparación de tu auto en ${nombre} 👉 ${url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(`${nombre} · Autocontrol`)}&body=${encodeURIComponent(mensaje)}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignorar */
    }
  }

  function descargarQR() {
    const canvas = document.getElementById("qr-taller") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${nombre.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className="gap-2">
        <ShareIcon size={16} /> Compartir
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Compartir taller
                </h2>
                <p className="text-sm text-slate-500">{nombre}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* QR */}
            <div className="mt-5 flex flex-col items-center">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                {url && (
                  <QRCodeCanvas
                    id="qr-taller"
                    value={url}
                    size={196}
                    level="H"
                    marginSize={2}
                    imageSettings={{
                      src: "/autocontrol-logo.png",
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                )}
              </div>
              <button
                onClick={descargarQR}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
              >
                <DownloadIcon size={15} /> Descargar QR
              </button>
            </div>

            {/* Enlace */}
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                {url}
              </span>
              <button
                onClick={copiar}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand-600 hover:bg-white"
              >
                {copiado ? (
                  <>
                    <CheckIcon size={15} /> Copiado
                  </>
                ) : (
                  <>
                    <CopyIcon size={15} /> Copiar
                  </>
                )}
              </button>
            </div>

            {/* Botones de compartir */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
              <a
                href={mailHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <MailIcon size={18} /> Email
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
