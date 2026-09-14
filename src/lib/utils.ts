import { Prisma } from "@prisma/client";
import { AR_TZ } from "@/lib/agenda";

// ─────────────────────────────────────────────────────────────
// Formato de fechas y montos
// ─────────────────────────────────────────────────────────────
// Estas funciones corren en el servidor y en el navegador sobre la misma
// fecha, así que tienen que dar EXACTAMENTE el mismo texto o React tira un
// error de hidratación. Dejarle el armado a Intl no alcanza por dos motivos:
//
//  1. Los separadores que mete Intl dependen de la versión de ICU. En "04:39
//     p. m." el espacio antes de "p. m." es U+202F en ICU nuevo y un espacio
//     normal en otras versiones: se ve igual, pero no es el mismo texto.
//  2. Sin `timeZone`, cada entorno usa la suya. En producción el contenedor
//     corre en UTC y el navegador del taller en Argentina: tres horas de
//     diferencia en la misma pantalla.
//
// Por eso fijamos la zona horaria y armamos el string nosotros a partir de
// los números, sin usar los literales de Intl.

/** Partes de una fecha en horario de Argentina, con hora de 00 a 23. */
function partesAR(date: Date | string): Record<string, string> {
  const d = typeof date === "string" ? new Date(date) : date;
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: AR_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  return Object.fromEntries(partes.map((p) => [p.type, p.value]));
}

/** Formatea un monto en pesos: `$ 120.000,00`. */
export function formatMoney(
  value: number | string | Prisma.Decimal,
): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  // Sin `style: "currency"`: el espacio que Intl pone después del símbolo es
  // U+00A0 y también varía entre versiones de ICU.
  const numero = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `$ ${numero}`;
}

/** Formatea fecha y hora en horario argentino: `13/09/2026, 16:39`. */
export function formatDate(date: Date | string): string {
  const p = partesAR(date);
  return `${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute}`;
}

/** Formatea solo la fecha en horario argentino: `13/09/2026`. */
export function formatFechaAR(date: Date | string): string {
  const p = partesAR(date);
  return `${p.day}/${p.month}/${p.year}`;
}

/** Formatea solo la hora en horario argentino: `16:39`. */
export function formatHoraAR(date: Date | string): string {
  const p = partesAR(date);
  return `${p.hour}:${p.minute}`;
}

/**
 * Año, mes (1-12) y día de un instante, en horario argentino.
 *
 * Sirve para ubicar un turno en el día del calendario que le corresponde: un
 * turno de las 23:00 en Argentina cae al día siguiente en UTC, así que usar la
 * zona del entorno lo mostraría en la casilla equivocada.
 */
export function diaAR(date: Date | string): {
  anio: number;
  mes: number;
  dia: number;
} {
  const p = partesAR(date);
  return { anio: Number(p.year), mes: Number(p.month), dia: Number(p.day) };
}

/** Convierte un texto a un slug apto para URLs. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Une clases condicionalmente (mini helper estilo clsx). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Etiquetas legibles para los estados de orden. */
export const ORDEN_ESTADO_LABEL: Record<string, string> = {
  ABIERTA: "En proceso",
  LISTA: "Listo para retirar",
  PAGADA: "Pagada",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

export const ORDEN_ESTADO_COLOR: Record<string, string> = {
  ABIERTA: "bg-blue-100 text-blue-700",
  LISTA: "bg-amber-100 text-amber-700",
  PAGADA: "bg-green-100 text-green-700",
  ENTREGADA: "bg-slate-100 text-slate-700",
  CANCELADA: "bg-red-100 text-red-700",
};
