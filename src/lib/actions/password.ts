"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplate } from "@/lib/mailer";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const TOKEN_TTL_MIN = 60; // el link vale 1 hora

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function baseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Solicita el reset: si el email existe, genera un token y manda el link.
 * Siempre responde "ok" para no revelar qué emails están registrados.
 */
export async function solicitarReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: z.string().email("Email inválido") })
    .safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Invalida tokens anteriores sin usar
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usadoEn: null },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiraEn: new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000),
      },
    });

    const link = `${baseUrl()}/recuperar/${rawToken}`;

    await sendEmail({
      to: email,
      subject: "Recuperá tu contraseña · Autocontrol",
      html: emailTemplate(
        "Recuperá tu contraseña",
        `Recibimos un pedido para restablecer tu contraseña. Entrá al siguiente enlace (vence en 1 hora):<br><br>
         <a href="${link}" style="color:#2b4b80;font-weight:600;">Restablecer contraseña</a><br><br>
         Si no fuiste vos, ignorá este mensaje.`,
      ),
    });

    // En desarrollo (sin SMTP) mostramos el link en la consola para poder probar.
    if (!process.env.SMTP_HOST) {
      console.log(`\n🔑 [RESET] Link para ${email}:\n   ${link}\n`);
    }
  }

  return { ok: true };
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

/** Aplica la nueva contraseña si el token es válido y no venció. */
export async function resetearPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { token, password } = parsed.data;
  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!registro || registro.usadoEn || registro.expiraEn < new Date()) {
    return {
      error: "El enlace no es válido o ya venció. Pedí uno nuevo.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usadoEn: new Date() },
    }),
  ]);

  return { ok: true };
}
