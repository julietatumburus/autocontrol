import { Prisma } from "@prisma/client";

/** Formatea un monto como moneda local (ARS por defecto). */
export function formatMoney(
  value: number | string | Prisma.Decimal,
  currency = "ARS",
): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

/** Formatea una fecha de forma legible. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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
