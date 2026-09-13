import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/html";

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

/** Envoltura visual del email. `cuerpoHtml` ya tiene que venir seguro. */
function envoltura(tituloHtml: string, cuerpoHtml: string): string {
  return `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <div style="background: #0f172a; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">🚗 Autocontrol</h1>
    </div>
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
      <h2 style="margin-top: 0; color: #0f172a;">${tituloHtml}</h2>
      <p style="color: #475569; line-height: 1.6;">${cuerpoHtml}</p>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
        Este es un aviso automático de Autocontrol.
      </p>
    </div>
  </div>`;
}

/**
 * Plantilla para avisos. Escapa el contenido: el título y el mensaje llegan
 * con texto que escribió un usuario (mensajes del chat, nombres, motivos de
 * rechazo) y sin escapar se podría inyectar HTML —un enlace de phishing, por
 * ejemplo— en el mail que recibe la otra parte.
 */
export function emailTemplate(titulo: string, mensaje: string): string {
  return envoltura(
    escapeHtml(titulo),
    escapeHtml(mensaje).replace(/\n/g, "<br>"),
  );
}

/**
 * Variante para los pocos emails que la app arma con HTML propio (por ejemplo
 * el link de recuperación). El llamador es responsable de escapar lo que
 * provenga del usuario.
 */
export function emailTemplateHtml(titulo: string, cuerpoHtml: string): string {
  return envoltura(escapeHtml(titulo), cuerpoHtml);
}
