import Galeria, { type Foto } from "@/components/Galeria";

/**
 * Muestra las fotos agrupadas por etapa. Cada grupo se ordena por la foto más
 * reciente. Las fotos vienen ya ordenadas por creadoEn desc.
 */
export default function GaleriaPorEtapa({
  fotos,
  editable = false,
}: {
  fotos: Foto[];
  editable?: boolean;
}) {
  if (fotos.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay fotos del avance.</p>;
  }

  const grupos = new Map<string, Foto[]>();
  for (const f of fotos) {
    const key = f.etapaNombre ?? "Sin etapa";
    const arr = grupos.get(key);
    if (arr) arr.push(f);
    else grupos.set(key, [f]);
  }

  // Ordena los grupos por su foto más reciente (las fotos ya vienen desc)
  const keys = [...grupos.keys()].sort((a, b) => {
    const ta = new Date(grupos.get(a)![0].creadoEn).getTime();
    const tb = new Date(grupos.get(b)![0].creadoEn).getTime();
    return tb - ta;
  });

  return (
    <div className="space-y-5">
      {keys.map((k) => (
        <div key={k}>
          <p className="mb-2 text-sm font-semibold text-slate-700">{k}</p>
          <Galeria fotos={grupos.get(k)!} editable={editable} />
        </div>
      ))}
    </div>
  );
}
