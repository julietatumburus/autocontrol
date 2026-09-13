import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// Almacenamiento de imágenes en disco.
//
// Antes las fotos y los logos se guardaban como data URL (base64) dentro de
// Postgres: una foto de 4 MB ocupaba ~5,4 MB por fila y se cargaba entera en
// memoria en cada lectura. Ahora el binario va al disco y en la base queda
// solo la clave.
//
// En Docker/Coolify hay que montar un volumen persistente en UPLOADS_DIR,
// si no las imágenes se pierden en cada despliegue.

const RAIZ = process.env.UPLOADS_DIR || "./uploads";

/** Tipos aceptados y su extensión en disco. */
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export const MIMES_ACEPTADOS = Object.keys(MIME_EXT);

/** Extensión → mime, para servir de vuelta lo guardado. */
const EXT_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXT).map(([mime, ext]) => [ext, mime]),
);

export function mimeAceptado(mime: string): boolean {
  return Boolean(MIME_EXT[mime]);
}

/** Una clave válida es "carpeta/archivo.ext": sin "..", sin rutas absolutas. */
function claveSegura(clave: string): string | null {
  if (!/^[a-z0-9]+\/[a-z0-9]+\.[a-z0-9]+$/i.test(clave)) return null;
  return clave;
}

export function esDataUrl(valor: string): boolean {
  return valor.startsWith("data:");
}

/** Parsea una data URL heredada de la versión anterior (compatibilidad). */
export function parseDataUrl(u: string): { mime: string; buf: Buffer } | null {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(u);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

/**
 * Guarda el archivo y devuelve la clave a persistir en la base
 * (ej: "fotos/9f3a2b1c4d5e6f70.jpg").
 */
export async function guardarImagen(
  carpeta: "fotos" | "logos",
  file: File,
): Promise<string> {
  const ext = MIME_EXT[file.type];
  if (!ext) throw new Error(`Tipo de imagen no soportado: ${file.type}`);

  const nombre = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const destino = path.join(RAIZ, carpeta);
  await fs.mkdir(destino, { recursive: true });
  await fs.writeFile(
    path.join(destino, nombre),
    Buffer.from(await file.arrayBuffer()),
  );
  return `${carpeta}/${nombre}`;
}

/**
 * Lee una imagen guardada. Acepta tanto una clave nueva como una data URL
 * heredada, así las filas viejas siguen funcionando sin migrar nada.
 */
export async function leerImagen(
  valor: string,
): Promise<{ mime: string; buf: Buffer } | null> {
  if (esDataUrl(valor)) return parseDataUrl(valor);

  const clave = claveSegura(valor);
  if (!clave) return null;

  try {
    const buf = await fs.readFile(path.join(RAIZ, clave));
    const ext = clave.split(".").pop()!.toLowerCase();
    return { mime: EXT_MIME[ext] ?? "application/octet-stream", buf };
  } catch {
    return null;
  }
}

/** Borra una imagen del disco. No falla si el archivo ya no está. */
export async function borrarImagen(valor: string): Promise<void> {
  if (esDataUrl(valor)) return; // fila heredada: no hay archivo que borrar
  const clave = claveSegura(valor);
  if (!clave) return;
  await fs.rm(path.join(RAIZ, clave), { force: true });
}
