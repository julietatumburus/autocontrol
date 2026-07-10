"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notificarCliente } from "@/lib/notificaciones";
import { formatMoney } from "@/lib/utils";

type Result = { error?: string; ok?: boolean; mensaje?: string };

/** Verifica que el usuario logueado sea staff (o super admin) del taller dado. */
async function autorizarStaff(tallerId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role === "SUPER_ADMIN") return session.user;
  const member = await prisma.tallerMember.findUnique({
    where: { userId_tallerId: { userId: session.user.id, tallerId } },
  });
  if (!member) throw new Error("Sin permiso sobre este taller");
  return session.user;
}

/** Recalcula y persiste el total de una orden a partir de sus ítems. */
async function recalcularTotal(
  tx: Prisma.TransactionClient,
  ordenId: string,
): Promise<Prisma.Decimal> {
  const items = await tx.itemAplicado.findMany({ where: { ordenId } });
  const total = items.reduce(
    (acc, it) => acc.add(it.cantidad.mul(it.precioUnitario)),
    new Prisma.Decimal(0),
  );
  await tx.ordenDeTrabajo.update({ where: { id: ordenId }, data: { total } });
  return total;
}

const crearOrdenSchema = z.object({
  tallerId: z.string().min(1),
  clienteEmail: z.string().email(),
  clienteNombre: z.string().min(2),
  clienteTelefono: z.string().optional(),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  anio: z.string().optional(),
  patente: z.string().min(1),
  color: z.string().optional(),
  descripcionProblema: z.string().optional(),
});

export async function crearOrden(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = crearOrdenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  const staff = await autorizarStaff(d.tallerId);

  // Primera etapa del taller
  const primeraEtapa = await prisma.etapaCatalogo.findFirst({
    where: { tallerId: d.tallerId },
    orderBy: { orden: "asc" },
  });
  if (!primeraEtapa) {
    return { error: "El taller no tiene etapas configuradas." };
  }

  let mensaje: string | undefined;

  const nueva = await prisma.$transaction(async (tx) => {
    // Cliente: lo busca por email; si no existe, lo crea con clave temporal.
    let cliente = await tx.user.findUnique({
      where: { email: d.clienteEmail.toLowerCase() },
    });
    if (!cliente) {
      const tempPass = Math.random().toString(36).slice(-8);
      cliente = await tx.user.create({
        data: {
          email: d.clienteEmail.toLowerCase(),
          nombre: d.clienteNombre,
          telefono: d.clienteTelefono,
          passwordHash: await bcrypt.hash(tempPass, 10),
          role: "CLIENTE",
        },
      });
      mensaje = `Cliente nuevo creado. Contraseña temporal: ${tempPass} (compartila con el cliente).`;
    }

    const vehiculo = await tx.vehiculo.create({
      data: {
        clienteId: cliente.id,
        marca: d.marca,
        modelo: d.modelo,
        anio: d.anio ? Number(d.anio) : null,
        patente: d.patente.toUpperCase(),
        color: d.color,
      },
    });

    const orden = await tx.ordenDeTrabajo.create({
      data: {
        tallerId: d.tallerId,
        vehiculoId: vehiculo.id,
        clienteId: cliente.id,
        creadoPorId: staff.id,
        descripcionProblema: d.descripcionProblema,
        etapaActualId: primeraEtapa.id,
        estado: "ABIERTA",
        timeline: {
          create: {
            etapaCatalogoId: primeraEtapa.id,
            nombre: primeraEtapa.nombre,
            registradoPorId: staff.id,
          },
        },
      },
    });

    return { ordenId: orden.id, clienteId: cliente.id };
  });

  // El aviso (in-app + email) va FUERA de la transacción: una demora o fallo
  // del SMTP no debe abortar la creación de la orden (timeout de transacción).
  await notificarCliente({
    userId: nueva.clienteId,
    ordenId: nueva.ordenId,
    tipo: "ORDEN_CREADA",
    titulo: "Tu orden fue creada",
    mensaje: `Tu ${d.marca} ${d.modelo} ingresó al taller. Ya podés seguir la reparación desde Autocontrol.`,
  });

  revalidatePath("/panel/ordenes");
  return { ok: true, mensaje };
}

/** Mueve la orden a una etapa del catálogo (avanza la "evolución"). */
export async function avanzarEtapa(
  ordenId: string,
  etapaCatalogoId: string,
  nota?: string,
): Promise<Result> {
  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: ordenId },
    include: { cliente: true, vehiculo: true },
  });
  if (!orden) return { error: "Orden no encontrada" };
  const staff = await autorizarStaff(orden.tallerId);

  const etapa = await prisma.etapaCatalogo.findUnique({
    where: { id: etapaCatalogoId },
  });
  if (!etapa || etapa.tallerId !== orden.tallerId) {
    return { error: "Etapa inválida" };
  }

  await prisma.$transaction(async (tx) => {
    // Cierra la etapa abierta actual
    await tx.ordenEtapa.updateMany({
      where: { ordenId, salidaEn: null },
      data: { salidaEn: new Date() },
    });
    // Abre la nueva etapa
    await tx.ordenEtapa.create({
      data: {
        ordenId,
        etapaCatalogoId: etapa.id,
        nombre: etapa.nombre,
        nota,
        registradoPorId: staff.id,
      },
    });
    await tx.ordenDeTrabajo.update({
      where: { id: ordenId },
      data: {
        etapaActualId: etapa.id,
        estado: etapa.esFinal ? "LISTA" : "ABIERTA",
        listaEn: etapa.esFinal ? new Date() : null,
      },
    });
  });

  // Avisos al cliente
  if (etapa.esFinal) {
    await notificarCliente({
      userId: orden.clienteId,
      ordenId,
      tipo: "ORDEN_LISTA",
      titulo: "¡Tu auto está listo para retirar! 🎉",
      mensaje: `Tu ${orden.vehiculo.marca} ${orden.vehiculo.modelo} terminó la reparación. Acercate al taller para retirarlo y abonar el servicio.`,
    });
  } else {
    await notificarCliente({
      userId: orden.clienteId,
      ordenId,
      tipo: "ETAPA_ACTUALIZADA",
      titulo: `Tu reparación avanzó: ${etapa.nombre}`,
      mensaje: `Tu ${orden.vehiculo.marca} ${orden.vehiculo.modelo} pasó a la etapa "${etapa.nombre}".`,
    });
  }

  revalidatePath(`/panel/ordenes/${ordenId}`);
  revalidatePath("/mi-cuenta");
  return { ok: true };
}

const itemSchema = z.object({
  ordenId: z.string().min(1),
  tipo: z.enum(["REPUESTO", "PRODUCTO", "MANO_OBRA"]),
  nombre: z.string().min(1),
  cantidad: z.string(),
  precioUnitario: z.string(),
});

export async function agregarItem(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: d.ordenId },
  });
  if (!orden) return { error: "Orden no encontrada" };
  const staff = await autorizarStaff(orden.tallerId);

  await prisma.$transaction(async (tx) => {
    await tx.itemAplicado.create({
      data: {
        ordenId: d.ordenId,
        ordenEtapaId: orden.etapaActualId
          ? (
              await tx.ordenEtapa.findFirst({
                where: { ordenId: d.ordenId, salidaEn: null },
                orderBy: { ingresoEn: "desc" },
              })
            )?.id
          : undefined,
        tipo: d.tipo,
        nombre: d.nombre,
        cantidad: new Prisma.Decimal(d.cantidad || "1"),
        precioUnitario: new Prisma.Decimal(d.precioUnitario || "0"),
        registradoPorId: staff.id,
      },
    });
    await recalcularTotal(tx, d.ordenId);
  });

  revalidatePath(`/panel/ordenes/${d.ordenId}`);
  revalidatePath("/mi-cuenta");
  return { ok: true };
}

export async function eliminarItem(itemId: string): Promise<Result> {
  const item = await prisma.itemAplicado.findUnique({
    where: { id: itemId },
    include: { orden: true },
  });
  if (!item) return { error: "Ítem no encontrado" };
  await autorizarStaff(item.orden.tallerId);

  await prisma.$transaction(async (tx) => {
    await tx.itemAplicado.delete({ where: { id: itemId } });
    await recalcularTotal(tx, item.ordenId);
  });

  revalidatePath(`/panel/ordenes/${item.ordenId}`);
  return { ok: true };
}

const pagoSchema = z.object({
  ordenId: z.string().min(1),
  monto: z.string(),
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"]),
  nota: z.string().optional(),
});

/** Registra el pago en el taller y emite el comprobante de servicio. */
export async function registrarPago(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  const parsed = pagoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: d.ordenId },
    include: {
      items: true,
      vehiculo: true,
      cliente: true,
      taller: true,
    },
  });
  if (!orden) return { error: "Orden no encontrada" };
  const staff = await autorizarStaff(orden.tallerId);

  let numeroComprobante = "";

  await prisma.$transaction(async (tx) => {
    const pago = await tx.pago.create({
      data: {
        ordenId: d.ordenId,
        monto: new Prisma.Decimal(d.monto),
        metodo: d.metodo,
        nota: d.nota,
        registradoPorId: staff.id,
      },
    });

    // Numeración por taller (no expone el total global de la plataforma)
    const seq = await tx.comprobante.count({
      where: { orden: { tallerId: orden.tallerId } },
    });
    const code = orden.tallerId.slice(-5).toUpperCase();
    numeroComprobante = `AC-${code}-${String(seq + 1).padStart(4, "0")}`;

    await tx.comprobante.create({
      data: {
        ordenId: d.ordenId,
        pagoId: pago.id,
        numero: numeroComprobante,
        total: orden.total,
        detalle: {
          taller: orden.taller.nombre,
          cliente: orden.cliente.nombre,
          vehiculo: `${orden.vehiculo.marca} ${orden.vehiculo.modelo} (${orden.vehiculo.patente})`,
          items: orden.items.map((it) => ({
            nombre: it.nombre,
            tipo: it.tipo,
            cantidad: it.cantidad.toString(),
            precioUnitario: it.precioUnitario.toString(),
            subtotal: it.cantidad.mul(it.precioUnitario).toString(),
          })),
          metodo: d.metodo,
          total: orden.total.toString(),
        },
      },
    });

    await tx.ordenDeTrabajo.update({
      where: { id: d.ordenId },
      data: { estado: "PAGADA" },
    });
  });

  await notificarCliente({
    userId: orden.clienteId,
    ordenId: d.ordenId,
    tipo: "COMPROBANTE_EMITIDO",
    titulo: "Pago registrado y comprobante emitido",
    mensaje: `Registramos tu pago de ${formatMoney(orden.total)} en ${orden.taller.nombre}. Tu comprobante ${numeroComprobante} ya está disponible en Autocontrol.`,
  });

  revalidatePath(`/panel/ordenes/${d.ordenId}`);
  revalidatePath("/mi-cuenta");
  return { ok: true };
}

/** Marca la orden como entregada (cierre). */
export async function entregarOrden(ordenId: string): Promise<Result> {
  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: ordenId },
  });
  if (!orden) return { error: "Orden no encontrada" };
  await autorizarStaff(orden.tallerId);

  await prisma.ordenDeTrabajo.update({
    where: { id: ordenId },
    data: { estado: "ENTREGADA", entregadaEn: new Date() },
  });

  revalidatePath(`/panel/ordenes/${ordenId}`);
  return { ok: true };
}
