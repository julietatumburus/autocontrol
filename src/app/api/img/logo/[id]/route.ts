import { prisma } from "@/lib/prisma";
import { leerImagen } from "@/lib/storage";

// Sirve el logo del taller. Es público a propósito: aparece en la landing y en
// el perfil público del taller, así que se puede cachear en cachés compartidas.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taller = await prisma.taller.findUnique({
    where: { id },
    select: { logoUrl: true },
  });
  if (!taller?.logoUrl) return new Response("Sin logo", { status: 404 });

  const imagen = await leerImagen(taller.logoUrl);
  if (!imagen) return new Response("Sin logo", { status: 404 });

  return new Response(new Uint8Array(imagen.buf), {
    headers: {
      "Content-Type": imagen.mime,
      // El logo puede cambiar al re-subirlo → caché moderada con revalidación.
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });
}
