"use client";

import { useState, useTransition } from "react";
import { cn, diaAR, formatHoraAR } from "@/lib/utils";
import { AR_TZ, hoyAR } from "@/lib/agenda";
import { Badge, Button, Label, Select } from "@/components/ui";
import { marcarOcupado, liberarBloqueo } from "@/lib/actions/turnos";
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

type Config = {
  apertura: string;
  cierre: string;
  duracion: number;
  dias: number[];
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

// Clave de una casilla del calendario. Las casillas son fechas sinteticas
// (`new Date(anio, mes, dia)`), asi que sus partes locales son estables.
const clave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Clave de un turno: es un instante real, y hay que ubicarlo en el dia que le
// corresponde EN ARGENTINA. Con la zona del entorno, un turno de las 23:00
// caia al dia siguiente en un servidor en UTC.
const claveTurno = (iso: string) => {
  const { anio, mes, dia } = diaAR(iso);
  return `${anio}-${mes - 1}-${dia}`;
};

const hhmm = (iso: string) => formatHoraAR(iso);
const esOcupado = (t: TurnoDTO) => t.tipo === "OCUPADO";

function generarSlots(config: Config): string[] {
  const [ha, ma] = config.apertura.split(":").map(Number);
  const [hc, mc] = config.cierre.split(":").map(Number);
  const inicio = ha * 60 + (ma || 0);
  const fin = hc * 60 + (mc || 0);
  const paso = config.duracion || 30;
  const out: string[] = [];
  for (let m = inicio; m + paso <= fin; m += paso) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

// Hoy en Argentina, con el formato que espera un <input type="date">.
const hoyStr = hoyAR;

export default function AgendaCalendar({
  turnos,
  tallerId,
  config,
}: {
  turnos: TurnoDTO[];
  tallerId: string;
  config: Config;
}) {
  // Todo lo que define "hoy" sale de la hora argentina, no de la del equipo:
  // asi el servidor y el navegador dibujan el mismo mes y marcan el mismo dia.
  const hoyPartes = diaAR(new Date());
  const claveHoy = `${hoyPartes.anio}-${hoyPartes.mes - 1}-${hoyPartes.dia}`;
  const [ref, setRef] = useState(
    new Date(hoyPartes.anio, hoyPartes.mes - 1, 1),
  );
  const [selId, setSelId] = useState<string | null>(null);

  // Marcar ocupado
  const [ocuparOpen, setOcuparOpen] = useState(false);
  const [fecha, setFecha] = useState(hoyStr());
  const [hora, setHora] = useState("");
  const [todoDia, setTodoDia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const slots = generarSlots(config);

  // Agrupar por día
  const porDia = new Map<string, TurnoDTO[]>();
  for (const t of turnos) {
    const k = claveTurno(t.fechaHora);
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
  const offset = (primero.getDay() + 6) % 7;
  const diasEnMes = new Date(year, month + 1, 0).getDate();

  const celdas: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(year, month, d));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const sel = turnos.find((t) => t.id === selId) ?? null;

  function ocupar() {
    if (!todoDia && !hora) {
      setError("Elegí un horario (o marcá 'todo el día').");
      return;
    }
    setError(null);
    start(async () => {
      const res = await marcarOcupado(tallerId, fecha, todoDia ? null : hora);
      if (res?.error) setError(res.error);
      else {
        setOcuparOpen(false);
        setHora("");
        setTodoDia(false);
      }
    });
  }

  function liberar(id: string) {
    start(async () => {
      const res = await liberarBloqueo(id);
      if (!res?.error) setSelId(null);
    });
  }

  return (
    <div>
      {/* Cabecera del mes + acción */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRef(new Date(year, month - 1, 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h2 className="min-w-[9rem] text-center text-lg font-semibold text-slate-900">
            {MESES[month]} {year}
          </h2>
          <button
            onClick={() => setRef(new Date(year, month + 1, 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            aria-label="Mes siguiente"
          >
            ›
          </button>
          {(month !== hoyPartes.mes - 1 || year !== hoyPartes.anio) && (
            <button
              onClick={() =>
                setRef(new Date(hoyPartes.anio, hoyPartes.mes - 1, 1))
              }
              className="ml-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Hoy
            </button>
          )}
        </div>
        <Button variant="secondary" onClick={() => setOcuparOpen(true)} className="py-1.5">
          + Marcar ocupado
        </Button>
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
          const esHoy = clave(d) === claveHoy;
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
                {items.slice(0, 3).map((t) => {
                  const bloqueo = esOcupado(t);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelId(t.id)}
                      className={cn(
                        "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left",
                        bloqueo ? "bg-slate-200/70 hover:bg-slate-300/70" : "bg-slate-50 hover:bg-slate-100",
                      )}
                      title={`${hhmm(t.fechaHora)} · ${bloqueo ? "Ocupado" : t.nombre}`}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", bloqueo ? "bg-slate-500" : ESTADO_DOT[t.estado])} />
                      <span className={cn("truncate text-[10px] sm:text-[11px]", bloqueo ? "text-slate-500" : "text-slate-600")}>
                        <span className="font-medium">{hhmm(t.fechaHora)}</span>{" "}
                        <span className="hidden sm:inline">{bloqueo ? "Ocupado" : t.nombre}</span>
                      </span>
                    </button>
                  );
                })}
                {items.length > 3 && (
                  <div className="px-1 text-[10px] text-slate-400">+{items.length - 3} más</div>
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
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-500" /> Ocupado
        </span>
      </div>

      {/* Detalle del turno / bloqueo */}
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
                    timeZone: AR_TZ,
                    weekday: "long", day: "numeric", month: "long",
                  })}{" "}
                  · {hhmm(sel.fechaHora)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {esOcupado(sel) ? (
                    <Badge className="bg-slate-200 text-slate-700">Ocupado</Badge>
                  ) : (
                    <>
                      <Badge className="bg-brand-50 text-brand-700">
                        {sel.tipo === "PRESUPUESTO" ? "Presupuesto" : "Visita"}
                      </Badge>
                      <Badge className={ESTADO_COLOR[sel.estado]}>{ESTADO_LABEL[sel.estado]}</Badge>
                    </>
                  )}
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

            {esOcupado(sel) ? (
              <div className="mt-4">
                <p className="text-sm text-slate-500">
                  Horario bloqueado por una reserva recibida por fuera de Autocontrol.
                  No aparece disponible para los clientes.
                </p>
                <div className="mt-5 flex justify-end">
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => liberar(sel.id)}
                  >
                    {pending ? "Liberando..." : "Liberar horario"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="font-semibold text-slate-900">{sel.nombre}</p>
                  <p className="text-slate-600">{sel.email}</p>
                  {sel.telefono && <p className="text-slate-600">{sel.telefono}</p>}
                  {sel.vehiculo && <p className="text-slate-500">Vehículo: {sel.vehiculo}</p>}
                  {sel.motivo && <p className="text-slate-500">Motivo: {sel.motivo}</p>}
                </div>
                <div className="mt-5 flex justify-end">
                  <TurnoAcciones turnoId={sel.id} estado={sel.estado} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Marcar ocupado */}
      {ocuparOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setOcuparOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900">Marcar ocupado</h2>
            <p className="mt-1 text-sm text-slate-500">
              Bloqueá un horario para una reserva que recibiste por fuera. No se
              podrá reservar online.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="oc-fecha">Día</Label>
                <input
                  id="oc-fecha"
                  type="date"
                  value={fecha}
                  min={hoyStr()}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={todoDia}
                  onChange={(e) => setTodoDia(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Todo el día
              </label>

              {!todoDia && (
                <div>
                  <Label htmlFor="oc-hora">Horario</Label>
                  <Select id="oc-hora" value={hora} onChange={(e) => setHora(e.target.value)}>
                    <option value="">Elegí un horario…</option>
                    {slots.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </Select>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOcuparOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={ocupar} disabled={pending}>
                {pending ? "Guardando..." : "Marcar ocupado"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
