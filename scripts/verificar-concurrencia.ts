/**
 * Verificación de los arreglos de concurrencia contra una base real.
 *
 *   npx tsx scripts/verificar-concurrencia.ts
 *
 * No es parte de la suite de vitest porque necesita Postgres levantado.
 * Crea sus propios datos con un prefijo y los borra al terminar.
 */
import { PrismaClient } from "@prisma/client";
import { siguienteNumero } from "../src/lib/numeracion";

const prisma = new PrismaClient();
const SUFIJO = `test-${Date.now()}`;

let fallos = 0;

function check(ok: boolean, descripcion: string, detalle = "") {
  console.log(`${ok ? "  ✔" : "  ✘"} ${descripcion}${detalle ? ` — ${detalle}` : ""}`);
  if (!ok) fallos++;
}

async function main() {
  const taller = await prisma.taller.create({
    data: { slug: `taller-${SUFIJO}`, nombre: `Taller ${SUFIJO}`, estado: "ACTIVO" },
  });
  const cliente = await prisma.user.create({
    data: {
      email: `cliente-${SUFIJO}@test.local`,
      nombre: "Cliente de prueba",
      passwordHash: "x",
      role: "CLIENTE",
    },
  });

  try {
    // ── 1. Numeración atómica ──────────────────────────────────────────
    console.log("\n1) Numeración de comprobantes con 20 pedidos simultáneos");
    const numeros = await Promise.all(
      Array.from({ length: 20 }, () =>
        prisma.$transaction((tx) => siguienteNumero(tx, taller.id, "COMPROBANTE")),
      ),
    );
    const unicos = new Set(numeros);
    check(
      unicos.size === 20,
      "los 20 números son distintos",
      `${unicos.size}/20 únicos`,
    );
    const sufijos = [...unicos].map((n) => Number(n.split("-").pop())).sort((a, b) => a - b);
    check(
      sufijos[0] === 1 && sufijos[19] === 20,
      "la secuencia va de 1 a 20 sin huecos",
      `${sufijos[0]}..${sufijos[19]}`,
    );

    // ── 2. Doble reserva de turnos ─────────────────────────────────────
    console.log("\n2) Diez personas reservando el mismo horario a la vez");
    const instante = new Date("2027-01-15T13:00:00.000Z");
    const slotKey = `${taller.id}|${instante.toISOString()}`;
    const intentos = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        prisma.turno.create({
          data: {
            tallerId: taller.id,
            fechaHora: instante,
            slotKey,
            nombre: `Persona ${i}`,
            email: `p${i}-${SUFIJO}@test.local`,
          },
        }),
      ),
    );
    const aceptados = intentos.filter((r) => r.status === "fulfilled").length;
    check(aceptados === 1, "solo una reserva prospera", `${aceptados} aceptadas`);

    // Al cancelar se libera el horario y otro puede tomarlo.
    const tomado = await prisma.turno.findFirst({ where: { slotKey } });
    await prisma.turno.update({
      where: { id: tomado!.id },
      data: { estado: "CANCELADO", slotKey: null },
    });
    const reintento = await prisma.turno
      .create({
        data: {
          tallerId: taller.id,
          fechaHora: instante,
          slotKey,
          nombre: "Alguien más",
          email: `otro-${SUFIJO}@test.local`,
        },
      })
      .then(() => true)
      .catch(() => false);
    check(reintento, "tras cancelar, el horario vuelve a estar disponible");

    // ── 3. Vehículos duplicados ────────────────────────────────────────
    console.log("\n3) El mismo auto reingresando dos veces al taller");
    const datos = { marca: "Fiat", modelo: "Cronos", patente: `AA${Date.now() % 1000}BB` };
    const primero = await prisma.vehiculo.upsert({
      where: { clienteId_patente: { clienteId: cliente.id, patente: datos.patente } },
      create: { clienteId: cliente.id, ...datos },
      update: { marca: datos.marca, modelo: datos.modelo },
    });
    const segundo = await prisma.vehiculo.upsert({
      where: { clienteId_patente: { clienteId: cliente.id, patente: datos.patente } },
      create: { clienteId: cliente.id, ...datos },
      update: { marca: datos.marca, modelo: "Cronos Drive" },
    });
    check(primero.id === segundo.id, "se reutiliza el vehículo en vez de duplicarlo");
    check(segundo.modelo === "Cronos Drive", "los datos del vehículo se actualizan");

    const cuantos = await prisma.vehiculo.count({
      where: { clienteId: cliente.id, patente: datos.patente },
    });
    check(cuantos === 1, "queda un solo vehículo con esa patente", `${cuantos} filas`);
  } finally {
    await prisma.turno.deleteMany({ where: { tallerId: taller.id } });
    await prisma.contador.deleteMany({ where: { tallerId: taller.id } });
    await prisma.vehiculo.deleteMany({ where: { clienteId: cliente.id } });
    await prisma.user.delete({ where: { id: cliente.id } });
    await prisma.taller.delete({ where: { id: taller.id } });
    await prisma.$disconnect();
  }

  console.log(
    fallos === 0
      ? "\n✅ Todas las verificaciones pasaron.\n"
      : `\n❌ ${fallos} verificación(es) fallaron.\n`,
  );
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
