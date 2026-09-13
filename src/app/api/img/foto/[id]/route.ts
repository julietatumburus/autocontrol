import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leerImagen } from "@/lib/storage";

// Sirve la foto del avance de una orden. El binario vive en disco (o, en las
// filas heredadas, como data URL en la base); acá solo se resuelve el acceso.
//
// El middleware no cubre /api, así que la autorización se hace acá: la foto de
// una reparación solo la pueden ver el cliente dueño de la orden, el staff del
// taller y el super admin.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return new Response("No autenticado", { status: 401 });

  const foto = await prisma.ordenFoto.findUnique({
    where: { id },
    select: {
      url: true,
      orden: { select: { clienteId: true, tallerId: true } },
    },
  });
  if (!foto) return new Response("No encontrada", { status: 404 });

  const esCliente = foto.orden.clienteId === session.user.id;
  const esSuper = session.user.role === "SUPER_ADMIN";
  let permitido = esCliente || esSuper;
  if (!permitido) {
    const member = await prisma.tallerMember.findUnique({
      where: {
        userId_tallerId: {
          userId: session.user.id,
          tallerId: foto.orden.tallerId,
        },
      },
      select: { id: true },
    });
    permitido = Boolean(member);
  }
  // Mismo 404 que si no existiera: no confirmamos la existencia de la foto.
  if (!permitido) return new Response("No encontrada", { status: 404 });

  const imagen = await leerImagen(foto.url);
  if (!imagen) return new Response("No encontrada", { status: 404 });

  return new Response(new Uint8Array(imagen.buf), {
    headers: {
      "Content-Type": imagen.mime,
      // El contenido no cambia (id único), pero es privado: solo la caché del
      // navegador de quien tiene permiso, nunca una caché compartida.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
