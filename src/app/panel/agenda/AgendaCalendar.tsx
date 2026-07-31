"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import TurnoAcciones from "./TurnoAcciones";

export type TurnoDTO = {
  id: string;
  fechaHora: string; // ISO
  tipo: string;
  estado: string;
  nombre: string;
  email: string;
  telefono: string | null;
  vehiculo: string | null;
  motivo: string | null;
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const ESTADO_DOT: Record<string, string> = {
  SOLICITADO: "bg-amber-500",
  CONFIRMADO: "bg-green-500",
  CANCELADO: "bg-red-400",
  COMPLETADO: "bg-slate-400",
};
const ESTADO_COLOR: Record<string, string> = {
  SOLICITADO: "bg-amber-100 text-amber-700",
  CONFIRMADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700",
  COMPLETADO: "bg-slate-100 text-slate-700",
};
const ESTADO_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  COMPLETADO: "Completado",
};

const clave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export default function AgendaCalendar({ turnos }: { turnos: TurnoDTO[] }) {
  const hoy = new Date();
  const [ref, setRef] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [selId, setSelId] = useState<string | null>(null);

  // Turnos agrupados por día
  const porDia = new Map<string, TurnoDTO[]>();
  for (const t of turnos) {
    const k = clave(new Date(t.fechaHora));
    const arr = porDia.get(k);
    if (arr) arr.push(t);
    else porDia.set(k, [t]);
  }
  for (const arr of porDia.values()) {
    arr.sort((a, b) => +new Date(a.fechaHora) - +new Date(b.fechaHora));
  }

  const year = ref.getFullYear();
  const month = ref.getMonth();
  const primero = new Date(year, month, 1);
  const offset = (primero.getDay() + 6) % 7; // semana arranca el lunes
  const diasEnMes = new Date(year, month + 1, 0).getDate();

  const celdas: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(year, month, d));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const sel = turnos.find((t) => t.id === selId) ?? null;

  return (
    <div>
      {/* Cabecera del mes */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setRef(new Date(year, month - 1, 1))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {MESES[month]} {year}
          </h2>
          {(month !== hoy.getMonth() || year !== hoy.getFullYear()) && (
            <button
              onClick={() => setRef(new Date(hoy.getFullYear(), hoy.getMonth(), 1))}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Hoy
            </button>
          )}
        </div>
        <button
          onClick={() => setRef(new Date(year, month + 1, 1))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
        {DOW.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Grilla del mes */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[64px] sm:min-h-[92px]" />;
          const items = porDia.get(clave(d)) ?? [];
          const esHoy = clave(d) === clave(hoy);
          return (
            <div
              key={i}
              className={cn(
                "min-h-[64px] rounded-lg border p-1 sm:min-h-[92px]",
                esHoy ? "border-brand-400 bg-brand-50/50" : "border-slate-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "text-right text-[11px] leading-none sm:text-xs",
                  esHoy ? "font-bold text-brand-700" : "text-slate-400",
                )}
              >
                {d.getDate()}
              </div>
              <div className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelId(t.id)}
                    className="flex w-full items-center gap-1 rounded bg-slate-50 px-1 py-0.5 text-left hover:bg-slate-100"
                    title={`${hhmm(t.fechaHora)} · ${t.nombre}`}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ESTADO_DOT[t.estado])} />
                    <span className="truncate text-[10px] text-slate-600 sm:text-[11px]">
                      <span className="font-medium">{hhmm(t.fechaHora)}</span>{" "}
                      <span className="hidden sm:inline">{t.nombre}</span>
                    </span>
                  </button>
                ))}
                {items.length > 3 && (
                  <div className="px-1 text-[10px] text-slate-400">
                    +{items.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Referencias */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {Object.entries(ESTADO_LABEL).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", ESTADO_DOT[k])} /> {label}
          </span>
        ))}
      </div>

      {/* Detalle del turno seleccionado */}
      {sel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setSelId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium capitalize text-slate-900">
                  {new Date(sel.fechaHora).toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {hhmm(sel.fechaHora)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-brand-50 text-brand-700">
                    {sel.tipo === "PRESUPUESTO" ? "Presupuesto" : "Visita"}
                  </Badge>
                  <Badge className={ESTADO_COLOR[sel.estado]}>
                    {ESTADO_LABEL[sel.estado]}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setSelId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <p className="font-semibold text-slate-900">{sel.nombre}</p>
              <p className="text-slate-600">{sel.email}</p>
              {sel.telefono && <p className="text-slate-600">{sel.telefono}</p>}
              {sel.vehiculo && (
                <p className="text-slate-500">Vehículo: {sel.vehiculo}</p>
              )}
              {sel.motivo && <p className="text-slate-500">Motivo: {sel.motivo}</p>}
            </div>

            <div className="mt-5 flex justify-end">
              <TurnoAcciones turnoId={sel.id} estado={sel.estado} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
