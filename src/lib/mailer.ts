import nodemailer from "nodemailer";

// Transporter SMTP. Si no hay configuración SMTP, los emails se loguean
// en consola (útil para desarrollo). En Coolify, configurá las variables SMTP_*.
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
    // Evita que un SMTP lento/caído deje la petición colgada indefinidamente.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "Autocontrol <no-reply@autocontrol.app>";

  if (!transporter) {
    // Modo desarrollo sin SMTP: simulamos el envío.
    console.log(`\n📧 [EMAIL SIMULADO] Para: ${opts.to}\n   Asunto: ${opts.subject}\n`);
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("Error enviando email:", err);
    return false;
  }
}

/** Plantilla simple de email para notificaciones. */
export function emailTemplate(titulo: string, mensaje: string): string {
  return `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <div style="background: #0f172a; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">🚗 Autocontrol</h1>
    </div>
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
      <h2 style="margin-top: 0; color: #0f172a;">${titulo}</h2>
      <p style="color: #475569; line-height: 1.6;">${mensaje}</p>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
        Este es un aviso automático de Autocontrol.
      </p>
    </div>
  </div>`;
}
