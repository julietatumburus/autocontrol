import { formatDate } from "@/lib/utils";

export type EventoTimeline = {
  nombre: string;
  nota?: string | null;
  ingresoEn: Date | string;
  salidaEn?: Date | string | null;
};

export default function Timeline({ eventos }: { eventos: EventoTimeline[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-slate-500">Sin movimientos todavía.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l-2 border-slate-100 pl-6">
      {eventos.map((e, i) => {
        const activo = !e.salidaEn;
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                activo ? "bg-brand-600 ring-4 ring-brand-100" : "bg-slate-300"
              }`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{e.nombre}</p>
              {activo && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                  Etapa actual
                </span>
              )}
            </div>
            {e.nota && <p className="mt-1 text-sm text-slate-500">{e.nota}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {formatDate(e.ingresoEn)}
              {e.salidaEn ? ` → ${formatDate(e.salidaEn)}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
