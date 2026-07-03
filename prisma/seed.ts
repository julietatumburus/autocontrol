import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ETAPAS_DEFAULT = [
  { nombre: "Recibido", orden: 1, color: "#64748b", esFinal: false },
  { nombre: "Diagnóstico", orden: 2, color: "#3b82f6", esFinal: false },
  { nombre: "Presupuesto", orden: 3, color: "#8b5cf6", esFinal: false },
  { nombre: "En reparación", orden: 4, color: "#f59e0b", esFinal: false },
  { nombre: "Control de calidad", orden: 5, color: "#14b8a6", esFinal: false },
  { nombre: "Listo para retirar", orden: 6, color: "#22c55e", esFinal: true },
];

async function main() {
  console.log("🌱 Sembrando datos de Autocontrol...");

  const pass = await bcrypt.hash("autocontrol123", 10);

  // ── Super admin ──
  const superEmail = (process.env.SUPER_ADMIN_EMAIL ?? "admin@autocontrol.app").toLowerCase();
  await prisma.user.upsert({
    where: { email: superEmail },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: superEmail,
      nombre: "Super Admin",
      passwordHash: pass,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`   ✔ Super admin: ${superEmail} / autocontrol123`);

  // ── Taller demo (activo) ──
  const adminTallerEmail = "taller@autocontrol.app";
  const adminUser = await prisma.user.upsert({
    where: { email: adminTallerEmail },
    update: {},
    create: {
      email: adminTallerEmail,
      nombre: "Carlos (Taller)",
      telefono: "+54 11 5555-1111",
      passwordHash: pass,
      role: "TALLER",
    },
  });

  let taller = await prisma.taller.findUnique({ where: { slug: "taller-del-sur" } });
  if (!taller) {
    taller = await prisma.taller.create({
      data: {
        slug: "taller-del-sur",
        nombre: "Taller del Sur",
        descripcion:
          "Mecánica general, chapa y pintura. Más de 20 años cuidando tu auto.",
        direccion: "Av. Siempreviva 742, Buenos Aires",
        telefono: "+54 11 5555-1111",
        email: adminTallerEmail,
        estado: "ACTIVO",
        etapas: { create: ETAPAS_DEFAULT },
        servicios: {
          create: [
            { nombre: "Service completo", descripcion: "Aceite, filtros y revisión general", precioDesde: new Prisma.Decimal(45000) },
            { nombre: "Frenos", descripcion: "Pastillas, discos y purga", precioDesde: new Prisma.Decimal(38000) },
            { nombre: "Chapa y pintura", descripcion: "Reparación de carrocería", precioDesde: new Prisma.Decimal(60000) },
          ],
        },
      },
    });
    await prisma.tallerMember.create({
      data: { userId: adminUser.id, tallerId: taller.id, role: "ADMIN" },
    });
    console.log(`   ✔ Taller activo: Taller del Sur (${adminTallerEmail} / autocontrol123)`);
  }

  // ── Empleado del taller ──
  const empEmail = "empleado@autocontrol.app";
  const empleado = await prisma.user.upsert({
    where: { email: empEmail },
    update: {},
    create: {
      email: empEmail,
      nombre: "Sofía (Empleada)",
      passwordHash: pass,
      role: "TALLER",
    },
  });
  await prisma.tallerMember.upsert({
    where: { userId_tallerId: { userId: empleado.id, tallerId: taller.id } },
    update: {},
    create: { userId: empleado.id, tallerId: taller.id, role: "EMPLEADO" },
  });

  // ── Cliente demo ──
  const cliEmail = "cliente@autocontrol.app";
  const cliente = await prisma.user.upsert({
    where: { email: cliEmail },
    update: {},
    create: {
      email: cliEmail,
      nombre: "Juan Pérez",
      telefono: "+54 11 4444-2222",
      passwordHash: pass,
      role: "CLIENTE",
    },
  });
  console.log(`   ✔ Cliente: ${cliEmail} / autocontrol123`);

  // ── Orden demo en curso ──
  const yaExiste = await prisma.ordenDeTrabajo.findFirst({
    where: { clienteId: cliente.id, tallerId: taller.id },
  });
  if (!yaExiste) {
    const etapas = await prisma.etapaCatalogo.findMany({
      where: { tallerId: taller.id },
      orderBy: { orden: "asc" },
    });
    const vehiculo = await prisma.vehiculo.create({
      data: {
        clienteId: cliente.id,
        marca: "Volkswagen",
        modelo: "Gol Trend",
        anio: 2018,
        patente: "AB123CD",
        color: "Gris",
      },
    });

    const orden = await prisma.ordenDeTrabajo.create({
      data: {
        tallerId: taller.id,
        vehiculoId: vehiculo.id,
        clienteId: cliente.id,
        creadoPorId: empleado.id,
        descripcionProblema: "Ruido en el tren delantero y service al día.",
        estado: "ABIERTA",
        etapaActualId: etapas[3].id, // En reparación
        total: new Prisma.Decimal(83000),
      },
    });

    // Timeline: pasó por las 3 primeras etapas y está en la 4ta
    for (let i = 0; i < 4; i++) {
      await prisma.ordenEtapa.create({
        data: {
          ordenId: orden.id,
          etapaCatalogoId: etapas[i].id,
          nombre: etapas[i].nombre,
          registradoPorId: empleado.id,
          salidaEn: i < 3 ? new Date() : null,
        },
      });
    }

    await prisma.itemAplicado.createMany({
      data: [
        { ordenId: orden.id, tipo: "REPUESTO", nombre: "Amortiguadores delanteros (par)", cantidad: new Prisma.Decimal(1), precioUnitario: new Prisma.Decimal(45000) },
        { ordenId: orden.id, tipo: "PRODUCTO", nombre: "Aceite sintético 5W30", cantidad: new Prisma.Decimal(4), precioUnitario: new Prisma.Decimal(3500) },
        { ordenId: orden.id, tipo: "MANO_OBRA", nombre: "Mano de obra tren delantero", cantidad: new Prisma.Decimal(1), precioUnitario: new Prisma.Decimal(24000) },
      ],
    });

    await prisma.notificacion.create({
      data: {
        userId: cliente.id,
        ordenId: orden.id,
        tipo: "ETAPA_ACTUALIZADA",
        titulo: "Tu reparación avanzó: En reparación",
        mensaje: "Tu Volkswagen Gol Trend pasó a la etapa \"En reparación\".",
      },
    });

    console.log("   ✔ Orden demo en curso creada");
  }

  // ── Segundo taller (pendiente de aprobar) ──
  const pendEmail = "pendiente@autocontrol.app";
  const pendUser = await prisma.user.upsert({
    where: { email: pendEmail },
    update: {},
    create: {
      email: pendEmail,
      nombre: "Taller Nuevo",
      passwordHash: pass,
      role: "TALLER",
    },
  });
  const tallerPend = await prisma.taller.findUnique({
    where: { slug: "lubricentro-norte" },
  });
  if (!tallerPend) {
    const t = await prisma.taller.create({
      data: {
        slug: "lubricentro-norte",
        nombre: "Lubricentro Norte",
        descripcion: "Cambios de aceite y service rápido.",
        estado: "PENDIENTE",
        etapas: { create: ETAPAS_DEFAULT },
      },
    });
    await prisma.tallerMember.create({
      data: { userId: pendUser.id, tallerId: t.id, role: "ADMIN" },
    });
    console.log("   ✔ Taller pendiente: Lubricentro Norte");
  }

  console.log("✅ Seed completado.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
