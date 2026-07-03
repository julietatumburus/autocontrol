// Cálculo del estado de la garantía de una orden entregada.

export type EstadoGarantia = {
  vigente: boolean;
  inicio: Date;
  fin: Date;
  diasRestantes: number;
  diasTotales: number;
  progreso: number; // % de tiempo transcurrido (0-100)
};

/** Calcula la garantía a partir de la fecha de entrega y la duración en meses. */
export function estadoGarantia(
  entregadaEn: Date | string,
  meses: number,
  ahora: Date = new Date(),
): EstadoGarantia {
  const inicio = new Date(entregadaEn);
  const fin = new Date(inicio);
  fin.setMonth(fin.getMonth() + meses);

  const total = fin.getTime() - inicio.getTime();
  const transcurrido = ahora.getTime() - inicio.getTime();
  const vigente = ahora.getTime() < fin.getTime();

  const msPorDia = 86_400_000;
  const diasRestantes = Math.max(
    0,
    Math.ceil((fin.getTime() - ahora.getTime()) / msPorDia),
  );
  const diasTotales = Math.round(total / msPorDia);
  const progreso = Math.min(100, Math.max(0, (transcurrido / total) * 100));

  return { vigente, inicio, fin, diasRestantes, diasTotales, progreso };
}

/** Formatea una fecha como DD/MM/AAAA. */
export function formatFechaCorta(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
