"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// Etapas por defecto que se crean para cada taller nuevo.
const ETAPAS_DEFAULT = [
  { nombre: "Recibido", orden: 1, color: "#64748b", esFinal: false },
  { nombre: "Diagnóstico", orden: 2, color: "#3b82f6", esFinal: false },
  { nombre: "Presupuesto", orden: 3, color: "#8b5cf6", esFinal: false },
  { nombre: "En reparación", orden: 4, color: "#f59e0b", esFinal: false },
  { nombre: "Control de calidad", orden: 5, color: "#14b8a6", esFinal: false },
  { nombre: "Listo para retirar", orden: 6, color: "#22c55e", esFinal: true },
];

const registroClienteSchema = z.object({
  nombre: z.string().min(2, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  telefono: z.string().trim().min(6, "Ingresá tu teléfono"),
  dni: z.string().trim().min(6, "Ingresá tu DNI"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registrarCliente(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registroClienteSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    dni: formData.get("dni"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { nombre, email, telefono, dni, password } = parsed.data;
  const existe = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existe) return { error: "Ya existe una cuenta con ese email" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      nombre,
      email: email.toLowerCase(),
      telefono,
      dni,
      passwordHash,
      role: "CLIENTE",
    },
  });

  await signIn("credentials", {
    email: email.toLowerCase(),
    password,
    redirect: false,
  });
  redirect("/mi-cuenta");
}

const registroTallerSchema = z.object({
  nombreTaller: z.string().min(2, "Ingresá el nombre del taller"),
  nombre: z.string().min(2, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  telefono: z.string().trim().min(6, "Ingresá tu teléfono"),
  dni: z.string().trim().min(6, "Ingresá tu DNI"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registrarTaller(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registroTallerSchema.safeParse({
    nombreTaller: formData.get("nombreTaller"),
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    dni: formData.get("dni"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { nombreTaller, nombre, email, telefono, dni, password } = parsed.data;
  const existe = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existe)
    return {
      error:
        "Ya existe una cuenta con ese email. Iniciá sesión y registrá tu taller desde tu cuenta.",
    };

  // Slug único para el taller
  const base = slugify(nombreTaller);
  let slug = base;
  let i = 1;
  while (await prisma.taller.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        nombre,
        email: email.toLowerCase(),
        telefono,
        dni,
        passwordHash,
        role: "TALLER",
      },
    });

    const taller = await tx.taller.create({
      data: {
        slug,
        nombre: nombreTaller,
        email: email.toLowerCase(),
        telefono,
        estado: "PENDIENTE", // el super admin lo activa
        etapas: { create: ETAPAS_DEFAULT },
      },
    });

    await tx.tallerMember.create({
      data: { userId: user.id, tallerId: taller.id, role: "ADMIN" },
    });
  });

  await signIn("credentials", {
    email: email.toLowerCase(),
    password,
    redirect: false,
  });
  redirect("/panel");
}

/** Destino por defecto: super admin → /admin; con taller → /panel; resto → /mi-cuenta. */
async function destinoInicial(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) return "/mi-cuenta";
  if (user.role === "SUPER_ADMIN") return "/admin";
  const member = await prisma.tallerMember.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  return member ? "/panel" : "/mi-cuenta";
}

export async function autenticar(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectParam = String(formData.get("redirect") || "");

  // 1. Autenticamos SIN redirigir, para que la cookie de sesión se confirme.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    throw error;
  }

  // 2. Decidimos a dónde ir: el parámetro explícito, o según el contexto.
  let destino = redirectParam && redirectParam !== "/" ? redirectParam : "";
  if (!destino) {
    destino = await destinoInicial(email);
  }

  // redirect() lanza NEXT_REDIRECT (fuera del try para no atraparlo).
  redirect(destino);
}
