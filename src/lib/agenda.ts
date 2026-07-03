// Helpers de agenda de turnos. Trabajamos en horario de Argentina (UTC-3, sin DST).

export const AR_TZ = "America/Argentina/Buenos_Aires";
const AR_OFFSET = "-03:00";

export type AgendaConfig = {
  agendaApertura: string; // "HH:MM"
  agendaCierre: string; // "HH:MM"
  agendaDuracionMin: number;
  agendaDias: number[]; // 0=Dom .. 6=Sáb
};

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function toHM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Instante (UTC real) de un turno a partir de fecha (YYYY-MM-DD) y hora (HH:MM) en AR. */
export function fechaHoraInstant(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${AR_OFFSET}`);
}

/** Fecha de hoy en AR como YYYY-MM-DD. */
export function hoyAR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AR_TZ }).format(new Date());
}

/** Día de la semana (0=Dom..6=Sáb) de una fecha YYYY-MM-DD. */
export function weekdayDe(fecha: string): number {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

/** Etiqueta legible de una fecha, ej: "lun 23 jun". */
export function etiquetaFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

/** Formatea un instante de turno en horario AR. */
export function formatTurno(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  }).format(d);
}

/** Próximas `n` fechas laborables (según agendaDias) a partir de hoy. */
export function proximasFechas(config: AgendaConfig, n = 14): string[] {
  const dias = config.agendaDias?.length ? config.agendaDias : [1, 2, 3, 4, 5];
  const out: string[] = [];
  const base = new Date(`${hoyAR()}T00:00:00Z`);
  for (let i = 0; i < 60 && out.length < n; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    if (dias.includes(d.getUTCDay())) {
      out.push(d.toISOString().slice(0, 10));
    }
  }
  return out;
}

/**
 * Slots horarios disponibles para una fecha: genera de apertura a cierre por
 * duración, descartando los pasados (si es hoy) y los ya ocupados.
 */
export function slotsDisponibles(
  config: AgendaConfig,
  fecha: string,
  ocupados: Set<string>,
  ahora: Date = new Date(),
): string[] {
  const inicio = parseHM(config.agendaApertura || "09:00");
  const fin = parseHM(config.agendaCierre || "18:00");
  const paso = config.agendaDuracionMin || 30;

  const out: string[] = [];
  for (let m = inicio; m + paso <= fin; m += paso) {
    const hora = toHM(m);
    const instante = fechaHoraInstant(fecha, hora);
    if (instante.getTime() <= ahora.getTime()) continue; // pasado
    if (ocupados.has(instante.toISOString())) continue; // ocupado
    out.push(hora);
  }
  return out;
}
