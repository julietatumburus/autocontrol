/**
 * Verifica la logica de datos de editarOrden() contra una base real.
 *
 *   npx tsx scripts/verificar-edicion-orden.ts
 *
 * Reproduce la transaccion de la action (upsert del vehiculo, repunte de la
 * orden y borrado del vehiculo huerfano) sobre datos descartables, porque es
 * la parte donde un error se lleva puesta una orden o deja vehiculos colgados.
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const SUF = `edit-${Date.now()}`;
let fallos = 0;

function check(ok: boolean, desc: string, detalle = "") {
  console.log(`${ok ? "  ✔" : "  ✘"} ${desc}${detalle ? ` — ${detalle}` : ""}`);
  if (!ok) fallos++;
}

/** Mismo cuerpo que la transaccion de editarOrden(). */
async function aplicarEdicion(
  ordenId: string,
  clienteId: string,
  patente: string,
  datos: { marca: string; modelo: string; anio: number | null; color: string | null },
) {
  const orden = await prisma.ordenDeTrabajo.findUniqueOrThrow({ where: { id: ordenId } });

  return prisma.$transaction(async (tx) => {
    const vehiculo = await tx.vehiculo.upsert({
      where: { clienteId_patente: { clienteId, patente } },
      create: { clienteId, patente, ...datos },
      update: { marca: datos.marca, modelo: datos.modelo, anio: datos.anio, color: datos.color },
    });

    await tx.ordenDeTrabajo.update({
      where: { id: ordenId },
      data: { clienteId, vehiculoId: vehiculo.id },
    });

    if (vehiculo.id !== orden.vehiculoId) {
      const enUso = await tx.ordenDeTrabajo.count({ where: { vehiculoId: orden.vehiculoId } });
      if (enUso === 0) await tx.vehiculo.delete({ where: { id: orden.vehiculoId } });
    }
    return vehiculo;
  });
}

async function main() {
  const taller = await prisma.taller.create({
    data: { slug: `t-${SUF}`, nombre: `Taller ${SUF}`, estado: "ACTIVO" },
  });
  const etapa = await prisma.etapaCatalogo.create({
    data: { tallerId: taller.id, nombre: "Recibido", orden: 1 },
  });
  const cliente = await prisma.user.create({
    data: { email: `c1-${SUF}@t.local`, nombre: "Cliente Uno", passwordHash: "x", role: "CLIENTE" },
  });
  const otro = await prisma.user.create({
    data: { email: `c2-${SUF}@t.local`, nombre: "Cliente Dos", passwordHash: "x", role: "CLIENTE" },
  });

  const nuevaOrden = async (vehiculoId: string) =>
    prisma.ordenDeTrabajo.create({
      data: {
        tallerId: taller.id, vehiculoId, clienteId: cliente.id,
        estado: "ABIERTA", etapaActualId: etapa.id, total: new Prisma.Decimal(0),
      },
    });

  try {
    // ── 1. Corregir la patente cuando el vehiculo solo tiene esa orden ──
    console.log("\n1) Patente mal cargada, vehiculo con una sola orden");
    let v = await prisma.vehiculo.create({
      data: { clienteId: cliente.id, marca: "VW", modelo: "Gol", patente: "AB123CD" },
    });
    let o = await nuevaOrden(v.id);
    await aplicarEdicion(o.id, cliente.id, "AB123CE", { marca: "VW", modelo: "Gol", anio: 2020, color: null });

    let recargada = await prisma.ordenDeTrabajo.findUniqueOrThrow({
      where: { id: o.id }, include: { vehiculo: true },
    });
    check(recargada.vehiculo.patente === "AB123CE", "la orden queda con la patente corregida", recargada.vehiculo.patente);
    check(recargada.vehiculo.anio === 2020, "se actualizan los demas datos del vehiculo");
    const viejoSigue = await prisma.vehiculo.findUnique({ where: { id: v.id } });
    check(viejoSigue === null, "el vehiculo viejo no queda huerfano");

    // ── 2. Corregir la patente cuando el vehiculo es compartido ──
    console.log("\n2) Vehiculo compartido por dos ordenes");
    v = await prisma.vehiculo.create({
      data: { clienteId: cliente.id, marca: "Ford", modelo: "Ka", patente: "CD456EF" },
    });
    const oA = await nuevaOrden(v.id);
    const oB = await nuevaOrden(v.id);
    await aplicarEdicion(oA.id, cliente.id, "CD456EG", { marca: "Ford", modelo: "Ka", anio: null, color: null });

    const rA = await prisma.ordenDeTrabajo.findUniqueOrThrow({ where: { id: oA.id }, include: { vehiculo: true } });
    const rB = await prisma.ordenDeTrabajo.findUniqueOrThrow({ where: { id: oB.id }, include: { vehiculo: true } });
    check(rA.vehiculo.patente === "CD456EG", "la orden editada usa la patente nueva", rA.vehiculo.patente);
    check(rB.vehiculo.patente === "CD456EF", "la OTRA orden conserva la suya", rB.vehiculo.patente);
    check(rA.vehiculoId !== rB.vehiculoId, "quedaron como vehiculos distintos");

    // ── 3. Reasignar la orden a otro cliente ──
    console.log("\n3) Email mal cargado: la orden pasa a otra cuenta");
    v = await prisma.vehiculo.create({
      data: { clienteId: cliente.id, marca: "Fiat", modelo: "Cronos", patente: "EF789GH" },
    });
    o = await nuevaOrden(v.id);
    await aplicarEdicion(o.id, otro.id, "EF789GH", { marca: "Fiat", modelo: "Cronos", anio: null, color: null });

    recargada = await prisma.ordenDeTrabajo.findUniqueOrThrow({
      where: { id: o.id }, include: { vehiculo: true },
    });
    check(recargada.clienteId === otro.id, "la orden quedo en la cuenta correcta");
    check(recargada.vehiculo.clienteId === otro.id, "el vehiculo tambien es del nuevo cliente");
    check(
      (await prisma.vehiculo.findUnique({ where: { id: v.id } })) === null,
      "el vehiculo del cliente equivocado se limpia",
    );
    check(
      (await prisma.ordenDeTrabajo.count({ where: { clienteId: cliente.id, id: o.id } })) === 0,
      "el cliente anterior deja de ver la orden",
    );

    // ── 4. El nombre del cliente destino no se pisa ──
    console.log("\n4) La cuenta destino conserva sus datos");
    const sigue = await prisma.user.findUniqueOrThrow({ where: { id: otro.id } });
    check(sigue.nombre === "Cliente Dos", "no se sobreescribe el nombre de la otra cuenta", sigue.nombre);

    // ── 5. Sin vehiculos colgados al final ──
    console.log("\n5) Integridad general");
    const huerfanos = await prisma.vehiculo.count({
      where: { clienteId: { in: [cliente.id, otro.id] }, ordenes: { none: {} } },
    });
    check(huerfanos === 0, "no quedan vehiculos sin ninguna orden", `${huerfanos} huerfanos`);
  } finally {
    await prisma.ordenDeTrabajo.deleteMany({ where: { tallerId: taller.id } });
    await prisma.vehiculo.deleteMany({ where: { clienteId: { in: [cliente.id, otro.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [cliente.id, otro.id] } } });
    await prisma.taller.delete({ where: { id: taller.id } });
    await prisma.$disconnect();
  }

  console.log(fallos === 0 ? "\n✅ Todas las verificaciones pasaron.\n" : `\n❌ ${fallos} fallaron.\n`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
