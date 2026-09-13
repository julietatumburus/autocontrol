// Limitador de tasa en memoria (ventana deslizante por clave).
//
// Alcance: el contador vive en el proceso. Alcanza para un despliegue de una
// sola instancia (el caso de Coolify hoy). Si algún día corren varias réplicas,
// hay que mover el contador a Redis o a una tabla; el resto del código no cambia.

type Registro = { hits: number[]; };

const buckets = new Map<string, Registro>();
let ultimaLimpieza = Date.now();

/** Borra las claves sin actividad reciente para que el Map no crezca sin fin. */
function limpiar(ahora: number, ventanaMs: number) {
  if (ahora - ultimaLimpieza < 60_000) return;
  ultimaLimpieza = ahora;
  for (const [clave, reg] of buckets) {
    if (reg.hits.every((t) => ahora - t > ventanaMs)) buckets.delete(clave);
  }
}

export type ResultadoLimite = {
  permitido: boolean;
  restantes: number;
  /** Segundos hasta que se libere un intento (solo si `permitido` es false). */
  esperaSegundos: number;
};

/**
 * Consume un intento para `clave`. Permite hasta `limite` intentos
 * dentro de `ventanaMs`.
 */
export function consumir(
  clave: string,
  limite: number,
  ventanaMs: number,
): ResultadoLimite {
  const ahora = Date.now();
  limpiar(ahora, ventanaMs);

  const reg = buckets.get(clave) ?? { hits: [] };
  reg.hits = reg.hits.filter((t) => ahora - t < ventanaMs);

  if (reg.hits.length >= limite) {
    buckets.set(clave, reg);
    const masViejo = reg.hits[0];
    return {
      permitido: false,
      restantes: 0,
      esperaSegundos: Math.max(1, Math.ceil((ventanaMs - (ahora - masViejo)) / 1000)),
    };
  }

  reg.hits.push(ahora);
  buckets.set(clave, reg);
  return {
    permitido: true,
    restantes: limite - reg.hits.length,
    esperaSegundos: 0,
  };
}

/** Devuelve los intentos de una clave al pool (para no penalizar un login exitoso). */
export function devolver(clave: string): void {
  buckets.delete(clave);
}

/** Mensaje de error uniforme para mostrarle al usuario. */
export function mensajeEspera(r: ResultadoLimite): string {
  if (r.esperaSegundos >= 60) {
    const min = Math.ceil(r.esperaSegundos / 60);
    return `Demasiados intentos. Probá de nuevo en ${min} minuto${min > 1 ? "s" : ""}.`;
  }
  return `Demasiados intentos. Probá de nuevo en ${r.esperaSegundos} segundos.`;
}
