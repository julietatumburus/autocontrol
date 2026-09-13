"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notificarCliente } from "@/lib/notificaciones";
import { enviarEmailAltaCliente } from "@/lib/password-reset";
import { siguienteNumero } from "@/lib/numeracion";
import {
  puedeCambiarEtapa,
  puedeModificarItems,
  puedeCobrar,
  puedeEntregar,
} from "@/lib/orden-estado";
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

/** Convierte a Decimal validando que sea un número usable y no negativo. */
function aDecimal(valor: string, porDefecto: string): Prisma.Decimal | null {
  const limpio = (valor || porDefecto).replace(",", ".").trim();
  try {
    const d = new Prisma.Decimal(limpio);
    if (!d.isFinite() || d.isNegative()) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Si el cliente ya había aprobado un presupuesto y el total dejó de coincidir,
 * se lo avisamos. El presupuesto conserva su propio snapshot, así que el
 * importe firmado no cambia; lo que no puede pasar es que el cliente se entere
 * del cambio recién al momento de pagar.
 */
async function avisarDesvioDePresupuesto(
  ordenId: string,
  totalNuevo: Prisma.Decimal,
): Promise<void> {
  const aprobado = await prisma.presupuesto.findFirst({
    where: { ordenId, estado: "APROBADO" },
    orderBy: { respondidoEn: "desc" },
    include: { orden: { select: { clienteId: true } } },
  });
  if (!aprobado || aprobado.total.equals(totalNuevo)) return;

  const diferencia = totalNuevo.sub(aprobado.total);
  const subio = diferencia.greaterThan(0);

  await notificarCliente({
    userId: aprobado.orden.clienteId,
    ordenId,
    tipo: "GENERAL",
    titulo: "El total de tu reparación cambió",
    mensaje:
      `El total pasó de ${formatMoney(aprobado.total)} (presupuesto ${aprobado.numero}, que aprobaste) ` +
      `a ${formatMoney(totalNuevo)}: ${subio ? "subió" : "bajó"} ${formatMoney(diferencia.abs())}. ` +
      `Si no estás de acuerdo, hablá con el taller antes de retirar el vehículo.`,
  });
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

  const taller = await prisma.taller.findUnique({
    where: { id: d.tallerId },
    select: { nombre: true },
  });
  if (!taller) return { error: "Taller no encontrado." };

  // Primera etapa del taller
  const primeraEtapa = await prisma.etapaCatalogo.findFirst({
    where: { tallerId: d.tallerId },
    orderBy: { orden: "asc" },
  });
  if (!primeraEtapa) {
    return { error: "El taller no tiene etapas configuradas." };
  }

  const email = d.clienteEmail.toLowerCase();
  const patente = d.patente.toUpperCase().replace(/\s+/g, "");

  // Cualquier cuenta puede ser cliente de un taller, incluida la del super
  // admin: el rol dice qué puede administrar, no impide dejar el auto en un
  // taller. Los permisos de cliente se resuelven por `clienteId`, no por rol.
  let esClienteNuevo = false;

  const nueva = await prisma.$transaction(async (tx) => {
    // Cliente: lo busca por email; si no existe, lo crea sin contraseña usable
    // (se la define él mismo con el link que le llega por email).
    let cliente = await tx.user.findUnique({ where: { email } });
    if (!cliente) {
      esClienteNuevo = true;
      cliente = await tx.user.create({
        data: {
          email,
          nombre: d.clienteNombre,
          telefono: d.clienteTelefono,
          // Hash de un valor aleatorio que nadie conoce: la cuenta queda
          // inaccesible hasta que el cliente define su contraseña.
          passwordHash: await bcrypt.hash(
            crypto.randomBytes(32).toString("hex"),
            10,
          ),
          role: "CLIENTE",
        },
      });
    }

    // Reutiliza el vehículo si el cliente ya lo tenía cargado: antes cada
    // ingreso al taller creaba un duplicado del mismo auto.
    const vehiculo = await tx.vehiculo.upsert({
      where: { clienteId_patente: { clienteId: cliente.id, patente } },
      create: {
        clienteId: cliente.id,
        marca: d.marca,
        modelo: d.modelo,
        anio: d.anio ? Number(d.anio) : null,
        patente,
        color: d.color,
      },
      update: {
        marca: d.marca,
        modelo: d.modelo,
        anio: d.anio ? Number(d.anio) : null,
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

  // Los avisos van FUERA de la transacción: una demora o fallo del SMTP no
  // debe abortar la creación de la orden (timeout de transacción).
  if (esClienteNuevo) {
    await enviarEmailAltaCliente(nueva.clienteId, email, taller.nombre);
  }

  await notificarCliente({
    userId: nueva.clienteId,
    ordenId: nueva.ordenId,
    tipo: "ORDEN_CREADA",
    titulo: "Tu orden fue creada",
    mensaje: `${taller.nombre} recibió tu ${d.marca} ${d.modelo} (${patente}). Ya podés seguir la reparación desde Autocontrol.`,
  });

  revalidatePath("/panel/ordenes");
  return {
    ok: true,
    mensaje: esClienteNuevo
      ? `Cliente nuevo creado. Le enviamos un email a ${email} para que defina su contraseña.`
      : undefined,
  };
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

  // Sin esta guarda, mover de etapa una orden ya cobrada la devolvía a
  // ABIERTA y se perdía el registro de que estaba pagada.
  const permiso = puedeCambiarEtapa(orden.estado);
  if (!permiso.ok) return { error: permiso.motivo };

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
        // Si ya había estado lista, conserva la fecha original en vez de
        // pisarla cada vez que se vuelve a la etapa final.
        listaEn: etapa.esFinal ? (orden.listaEn ?? new Date()) : null,
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

  const cantidad = aDecimal(d.cantidad, "1");
  const precio = aDecimal(d.precioUnitario, "0");
  if (!cantidad || cantidad.isZero()) return { error: "Cantidad inválida" };
  if (!precio) return { error: "Precio inválido" };

  const orden = await prisma.ordenDeTrabajo.findUnique({
    where: { id: d.ordenId },
  });
  if (!orden) return { error: "Orden no encontrada" };
  const staff = await autorizarStaff(orden.tallerId);

  const permiso = puedeModificarItems(orden.estado);
  if (!permiso.ok) return { error: permiso.motivo };

  const total = await prisma.$transaction(async (tx) => {
    const etapaAbierta = await tx.ordenEtapa.findFirst({
      where: { ordenId: d.ordenId, salidaEn: null },
      orderBy: { ingresoEn: "desc" },
      select: { id: true },
    });

    await tx.itemAplicado.create({
      data: {
        ordenId: d.ordenId,
        ordenEtapaId: etapaAbierta?.id,
        tipo: d.tipo,
        nombre: d.nombre,
        cantidad,
        precioUnitario: precio,
        registradoPorId: staff.id,
      },
    });
    return recalcularTotal(tx, d.ordenId);
  });

  await avisarDesvioDePresupuesto(d.ordenId, total);

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

  const permiso = puedeModificarItems(item.orden.estado);
  if (!permiso.ok) return { error: permiso.motivo };

  const total = await prisma.$transaction(async (tx) => {
    await tx.itemAplicado.delete({ where: { id: itemId } });
    return recalcularTotal(tx, item.ordenId);
  });

  await avisarDesvioDePresupuesto(item.ordenId, total);

  revalidatePath(`/panel/ordenes/${item.ordenId}`);
  revalidatePath("/mi-cuenta");
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
      comprobantes: { select: { numero: true } },
    },
  });
  if (!orden) return { error: "Orden no encontrada" };
  const staff = await autorizarStaff(orden.tallerId);

  // ── Validaciones que antes no existían (ver src/lib/orden-estado.ts) ──
  if (orden.comprobantes.length > 0) {
    return {
      error: `Esta orden ya tiene el comprobante ${orden.comprobantes[0].numero} emitido.`,
    };
  }
  const permiso = puedeCobrar({
    estado: orden.estado,
    totalEsPositivo: orden.total.greaterThan(0),
    yaTieneComprobante: false,
  });
  if (!permiso.ok) return { error: permiso.motivo };

  const monto = aDecimal(d.monto, "0");
  if (!monto) return { error: "Monto inválido" };
  if (!monto.equals(orden.total)) {
    // El comprobante se emite por `orden.total`; aceptar otro monto emitía un
    // comprobante que no coincidía con lo efectivamente cobrado.
    return {
      error: `El monto debe coincidir con el total de la orden (${formatMoney(orden.total)}).`,
    };
  }

  let numeroComprobante = "";

  await prisma.$transaction(async (tx) => {
    const pago = await tx.pago.create({
      data: {
        ordenId: d.ordenId,
        monto,
        metodo: d.metodo,
        nota: d.nota,
        registradoPorId: staff.id,
      },
    });

    // Numeración atómica por taller (no expone el total de la plataforma).
    numeroComprobante = await siguienteNumero(tx, orden.tallerId, "COMPROBANTE");

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

  const permiso = puedeEntregar(orden.estado);
  if (!permiso.ok) return { error: permiso.motivo };

  await prisma.ordenDeTrabajo.update({
    where: { id: ordenId },
    data: { estado: "ENTREGADA", entregadaEn: new Date() },
  });

  revalidatePath(`/panel/ordenes/${ordenId}`);
  return { ok: true };
}
