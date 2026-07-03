"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Result = { error?: string; ok?: boolean };

async function autorizarAdmin(tallerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role === "SUPER_ADMIN") return;
  const member = await prisma.tallerMember.findUnique({
    where: { userId_tallerId: { userId: session.user.id, tallerId } },
  });
  if (!member || member.role !== "ADMIN") {
    throw new Error("Solo el administrador del taller puede hacer esto");
  }
}

const tallerSchema = z.object({
  tallerId: z.string().min(1),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function actualizarTaller(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = tallerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;
  await autorizarAdmin(d.tallerId);

  await prisma.taller.update({
    where: { id: d.tallerId },
    data: {
      nombre: d.nombre,
      descripcion: d.descripcion || null,
      direccion: d.direccion || null,
      telefono: d.telefono || null,
      email: d.email || null,
    },
  });

  revalidatePath("/panel/config");
  return { ok: true };
}

/** Sube/reemplaza el logo del taller. Se guarda como data URL en la base. */
export async function actualizarLogo(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const tallerId = String(formData.get("tallerId") ?? "");
  if (!tallerId) return { error: "Taller inválido" };
  await autorizarAdmin(tallerId);

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí una imagen" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen (PNG, JPG, SVG…)" };
  }
  if (file.size > 1024 * 1024) {
    return { error: "La imagen no puede superar 1 MB" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.taller.update({
    where: { id: tallerId },
    data: { logoUrl: dataUrl },
  });

  revalidatePath("/panel/config");
  revalidatePath("/");
  revalidatePath("/talleres");
  return { ok: true };
}

/** Quita el logo del taller. */
export async function quitarLogo(tallerId: string): Promise<Result> {
  await autorizarAdmin(tallerId);
  await prisma.taller.update({
    where: { id: tallerId },
    data: { logoUrl: null },
  });
  revalidatePath("/panel/config");
  revalidatePath("/");
  revalidatePath("/talleres");
  return { ok: true };
}

const ETAPAS_DEFAULT = [
  { nombre: "Recibido", orden: 1, color: "#64748b", esFinal: false },
  { nombre: "Diagnóstico", orden: 2, color: "#3b82f6", esFinal: false },
  { nombre: "Presupuesto", orden: 3, color: "#8b5cf6", esFinal: false },
  { nombre: "En reparación", orden: 4, color: "#f59e0b", esFinal: false },
  { nombre: "Control de calidad", orden: 5, color: "#14b8a6", esFinal: false },
  { nombre: "Listo para retirar", orden: 6, color: "#22c55e", esFinal: true },
];

const crearTallerSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
});

/** Crea un taller para el usuario logueado (que aún no tiene uno). */
export async function crearTallerParaUsuario(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = crearTallerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  const base = d.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  let slug = base || "taller";
  let i = 1;
  while (await prisma.taller.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  await prisma.$transaction(async (tx) => {
    const taller = await tx.taller.create({
      data: {
        slug,
        nombre: d.nombre,
        descripcion: d.descripcion || null,
        direccion: d.direccion || null,
        telefono: d.telefono || null,
        estado: "PENDIENTE",
        etapas: { create: ETAPAS_DEFAULT },
      },
    });
    await tx.tallerMember.create({
      data: { userId: session.user.id, tallerId: taller.id, role: "ADMIN" },
    });
    if (session.user.role === "CLIENTE") {
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "TALLER" },
      });
    }
  });

  revalidatePath("/panel");
  return { ok: true };
}

const servicioSchema = z.object({
  tallerId: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  precioDesde: z.string().optional(),
});

export async function agregarServicio(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = servicioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;
  await autorizarAdmin(d.tallerId);

  await prisma.servicio.create({
    data: {
      tallerId: d.tallerId,
      nombre: d.nombre,
      descripcion: d.descripcion || null,
      precioDesde: d.precioDesde ? new Prisma.Decimal(d.precioDesde) : null,
    },
  });

  revalidatePath("/panel/config");
  return { ok: true };
}

const agendaSchema = z.object({
  tallerId: z.string().min(1),
  agendaApertura: z.string().regex(/^\d{2}:\d{2}$/, "Hora de apertura inválida"),
  agendaCierre: z.string().regex(/^\d{2}:\d{2}$/, "Hora de cierre inválida"),
  agendaDuracionMin: z.string(),
});

/** Configura la agenda de turnos del taller. */
export async function actualizarAgenda(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = agendaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;
  await autorizarAdmin(d.tallerId);

  const dias = formData
    .getAll("agendaDias")
    .map((x) => Number(x))
    .filter((n) => n >= 0 && n <= 6);
  const duracion = Number(d.agendaDuracionMin) || 30;
  const activa = formData.get("agendaActiva") === "on";

  if (d.agendaApertura >= d.agendaCierre) {
    return { error: "La hora de cierre debe ser posterior a la de apertura." };
  }

  await prisma.taller.update({
    where: { id: d.tallerId },
    data: {
      agendaActiva: activa,
      agendaApertura: d.agendaApertura,
      agendaCierre: d.agendaCierre,
      agendaDuracionMin: duracion,
      agendaDias: dias.length ? dias : [1, 2, 3, 4, 5],
    },
  });

  revalidatePath("/panel/config");
  return { ok: true };
}

/** Activa/desactiva la garantía del taller y define su duración. */
export async function actualizarGarantia(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const tallerId = String(formData.get("tallerId") ?? "");
  if (!tallerId) return { error: "Taller inválido" };
  await autorizarAdmin(tallerId);

  const activa = formData.get("garantiaActiva") === "on";
  const meses = Number(formData.get("garantiaMeses")) || 12;

  await prisma.taller.update({
    where: { id: tallerId },
    data: { garantiaActiva: activa, garantiaMeses: meses },
  });

  revalidatePath("/panel/config");
  revalidatePath("/panel/ordenes");
  return { ok: true };
}

export async function eliminarServicio(servicioId: string): Promise<Result> {
  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
  });
  if (!servicio) return { error: "Servicio no encontrado" };
  await autorizarAdmin(servicio.tallerId);

  await prisma.servicio.delete({ where: { id: servicioId } });
  revalidatePath("/panel/config");
  return { ok: true };
}
