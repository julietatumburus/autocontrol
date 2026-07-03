import { ShieldCheckIcon } from "@/components/icons";
import { estadoGarantia, formatFechaCorta } from "@/lib/garantia";

/**
 * Distintivo de garantía: muestra cómo corre la garantía desde la entrega.
 * - compact: solo el chip (para tablas/listas).
 * - completo: chip + barra de tiempo transcurrido + fechas.
 */
export default function GarantiaBadge({
  entregadaEn,
  meses,
  compact = false,
}: {
  entregadaEn: Date | string;
  meses: number;
  compact?: boolean;
}) {
  const g = estadoGarantia(entregadaEn, meses);

  if (!g.vigente) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        <ShieldCheckIcon size={13} /> Garantía vencida
      </span>
    );
  }

  const chip = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <ShieldCheckIcon size={13} /> En garantía · {g.diasRestantes} días
    </span>
  );

  if (compact) return chip;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {chip}
        <span className="text-xs text-slate-400">
          vence {formatFechaCorta(g.fin)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${g.progreso}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">
        Desde la entrega ({formatFechaCorta(g.inicio)}) · {meses}{" "}
        {meses === 1 ? "mes" : "meses"} de garantía
      </p>
    </div>
  );
}
