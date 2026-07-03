import { NotificacionTipo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplate } from "@/lib/mailer";

/**
 * Crea una notificación in-app para un cliente y, además, le envía un email.
 * Es el único punto por donde se disparan los avisos (in-app + email).
 */
export async function notificarCliente(opts: {
  userId: string;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  ordenId?: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true },
  });

  let emailEnviado = false;
  if (user?.email) {
    emailEnviado = await sendEmail({
      to: user.email,
      subject: opts.titulo,
      html: emailTemplate(opts.titulo, opts.mensaje),
    });
  }

  await prisma.notificacion.create({
    data: {
      userId: opts.userId,
      ordenId: opts.ordenId,
      tipo: opts.tipo,
      titulo: opts.titulo,
      mensaje: opts.mensaje,
      emailEnviado,
    },
  });
}
