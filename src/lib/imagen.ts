// Compresión/redimensionado de imágenes EN EL NAVEGADOR antes de subirlas.
// Evita guardar fotos de 3–5 MB del celular como base64 gigante en la base
// (lo que hacía el HTML pesadísimo y lento en el teléfono).

type Opts = {
  maxLado?: number; // lado máximo (px) del lado más largo
  calidad?: number; // 0..1
  tipo?: "image/jpeg" | "image/webp";
};

export async function comprimirImagen(file: File, opts: Opts = {}): Promise<File> {
  const { maxLado = 1280, calidad = 0.72, tipo = "image/jpeg" } = opts;

  // No tocar SVG/GIF ni cosas raras: ya son livianos o no se pueden rasterizar bien.
  if (
    typeof document === "undefined" ||
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // si el navegador no puede, subimos el original
  }

  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * escala));
  const h = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, tipo, calidad),
  );
  if (!blob || blob.size >= file.size) return file; // si no mejora, dejamos el original

  const ext = tipo === "image/webp" ? ".webp" : ".jpg";
  const nombre = file.name.replace(/\.[^.]+$/, "") + ext;
  return new File([blob], nombre, { type: tipo });
}
