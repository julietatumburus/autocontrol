import { prisma } from "@/lib/prisma";

// Sirve la foto de una orden como imagen binaria cacheable, en vez de embeber
// el base64 en el HTML. El HTML/payload queda liviano y el navegador cachea.

function parseDataUrl(u: string): { mime: string; buf: Buffer } | null {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(u);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const foto = await prisma.ordenFoto.findUnique({
    where: { id },
    select: { url: true },
  });
  if (!foto) return new Response("No encontrada", { status: 404 });

  const parsed = parseDataUrl(foto.url);
  if (!parsed) return Response.redirect(foto.url);

  return new Response(new Uint8Array(parsed.buf), {
    headers: {
      "Content-Type": parsed.mime,
      // El contenido de una foto no cambia (id único) → cache larga e inmutable.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
