"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashToken, enviarEmailRecuperacion } from "@/lib/password-reset";
import { consumir, mensajeEspera } from "@/lib/rate-limit";
import { ipDelCliente } from "@/lib/ip";

export type ActionState = { error?: string; ok?: boolean } | undefined;

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

  // Límite por email y por IP: sin esto se puede usar el formulario para
  // bombardear la casilla de cualquier persona registrada.
  const porEmail = consumir(`reset:email:${email}`, 3, 15 * 60_000);
  if (!porEmail.permitido) return { error: mensajeEspera(porEmail) };
  const porIp = consumir(`reset:ip:${await ipDelCliente()}`, 10, 15 * 60_000);
  if (!porIp.permitido) return { error: mensajeEspera(porIp) };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await enviarEmailRecuperacion(user.id, email);
  }

  return { ok: true };
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
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

  // Evita que se prueben tokens al voleo desde una misma IP.
  const porIp = consumir(`reset-apply:${await ipDelCliente()}`, 10, 15 * 60_000);
  if (!porIp.permitido) return { error: mensajeEspera(porIp) };

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
