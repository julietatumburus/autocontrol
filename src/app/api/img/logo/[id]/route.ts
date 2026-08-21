import { prisma } from "@/lib/prisma";

// Sirve el logo del taller como imagen binaria cacheable (en vez de base64
// embebido en cada página donde aparece).

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
  const taller = await prisma.taller.findUnique({
    where: { id },
    select: { logoUrl: true },
  });
  if (!taller?.logoUrl) return new Response("Sin logo", { status: 404 });

  const parsed = parseDataUrl(taller.logoUrl);
  if (!parsed) return Response.redirect(taller.logoUrl);

  return new Response(new Uint8Array(parsed.buf), {
    headers: {
      "Content-Type": parsed.mime,
      // El logo puede cambiar al re-subir → caché moderada con revalidación.
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });
}
