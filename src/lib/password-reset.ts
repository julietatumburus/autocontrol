import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplateHtml } from "@/lib/mailer";
import { escapeHtml } from "@/lib/html";
import { enDiferido } from "@/lib/diferido";

// Emisión de tokens para definir/recuperar contraseña. Se usa desde la
// recuperación clásica y también cuando el taller da de alta a un cliente
// nuevo: en vez de dictarle una contraseña temporal, le llega un link.
//
// No es un archivo "use server": estas funciones son internas. Exportarlas
// desde una server action las publicaría como endpoint y cualquiera podría
// pedir un token para el usuario que quisiera.

const TTL_RESET_MIN = 60; // el link de recuperación vale 1 hora
const TTL_ALTA_HORAS = 72; // el de alta de cliente, 3 días

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function baseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Invalida los tokens sin usar y emite uno nuevo. Devuelve el link completo. */
export async function crearLinkDePassword(
  userId: string,
  duracionMs: number,
): Promise<string> {
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usadoEn: null },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiraEn: new Date(Date.now() + duracionMs),
    },
  });

  return `${baseUrl()}/recuperar/${rawToken}`;
}

/** Email de recuperación de contraseña (lo pide el propio usuario). */
export async function enviarEmailRecuperacion(
  userId: string,
  email: string,
): Promise<void> {
  const link = await crearLinkDePassword(userId, TTL_RESET_MIN * 60 * 1000);

  enDiferido(() =>
    sendEmail({
      to: email,
      subject: "Recuperá tu contraseña · Autocontrol",
      html: emailTemplateHtml(
        "Recuperá tu contraseña",
        `Recibimos un pedido para restablecer tu contraseña. Entrá al siguiente enlace (vence en 1 hora):<br><br>
         <a href="${escapeHtml(link)}" style="color:#2b4b80;font-weight:600;">Restablecer contraseña</a><br><br>
         Si no fuiste vos, ignorá este mensaje.`,
      ),
    }),
  );

  // En desarrollo (sin SMTP) mostramos el link en consola para poder probar.
  if (!process.env.SMTP_HOST) {
    console.log(`\n🔑 [RESET] Link para ${email}:\n   ${link}\n`);
  }
}

/**
 * Email de bienvenida cuando el taller le crea la cuenta a un cliente.
 * Reemplaza a la contraseña temporal que antes se le dictaba en el mostrador.
 */
export async function enviarEmailAltaCliente(
  userId: string,
  email: string,
  tallerNombre: string,
): Promise<void> {
  const link = await crearLinkDePassword(userId, TTL_ALTA_HORAS * 3600 * 1000);

  enDiferido(() =>
    sendEmail({
      to: email,
      subject: "Tu cuenta de Autocontrol · definí tu contraseña",
      html: emailTemplateHtml(
        "Ya podés seguir tu reparación",
        `${escapeHtml(tallerNombre)} te dio de alta en Autocontrol para que sigas la reparación de tu vehículo.<br><br>
         Definí tu contraseña con este enlace (vence en 3 días):<br><br>
         <a href="${escapeHtml(link)}" style="color:#2b4b80;font-weight:600;">Definir mi contraseña</a>`,
      ),
    }),
  );

  if (!process.env.SMTP_HOST) {
    console.log(`\n🔑 [ALTA CLIENTE] Link para ${email}:\n   ${link}\n`);
  }
}
