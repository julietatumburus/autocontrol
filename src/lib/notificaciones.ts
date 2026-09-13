import { NotificacionTipo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplate } from "@/lib/mailer";
import { enDiferido } from "@/lib/diferido";

/**
 * Crea una notificación in-app para un usuario y le envía el email.
 * Es el único punto por donde se disparan los avisos (in-app + email).
 *
 * La notificación in-app se guarda de inmediato (es lo que el usuario ve al
 * instante); el email sale en diferido y recién ahí se marca `emailEnviado`.
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

  const notificacion = await prisma.notificacion.create({
    data: {
      userId: opts.userId,
      ordenId: opts.ordenId,
      tipo: opts.tipo,
      titulo: opts.titulo,
      mensaje: opts.mensaje,
      emailEnviado: false,
    },
  });

  if (!user?.email) return;

  enDiferido(async () => {
    const enviado = await sendEmail({
      to: user.email,
      subject: opts.titulo,
      html: emailTemplate(opts.titulo, opts.mensaje),
    });
    if (enviado) {
      await prisma.notificacion.update({
        where: { id: notificacion.id },
        data: { emailEnviado: true },
      });
    }
  });
}
