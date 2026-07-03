// ─────────────────────────────────────────────────────────────
// Autocontrol — Seed de PRODUCCIÓN
// Crea únicamente la cuenta de super admin (sin talleres ni órdenes demo).
// Se ejecuta desde el entrypoint cuando SEED_ON_START=true.
//
// Variables:
//   SUPER_ADMIN_EMAIL     → email del super admin (obligatorio en prod)
//   SUPER_ADMIN_PASSWORD  → contraseña inicial (default: autocontrol123)
//   SUPER_ADMIN_NOMBRE    → nombre a mostrar (default: "Super Admin")
// ─────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@autocontrol.app").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "autocontrol123";
  const nombre = process.env.SUPER_ADMIN_NOMBRE ?? "Super Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    // No pisamos la contraseña si el usuario ya existe (para no revertir un cambio manual).
    update: { role: "SUPER_ADMIN" },
    create: { email, nombre, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`✔ Super admin listo: ${email}`);
  if (password === "autocontrol123") {
    console.log("⚠️  Estás usando la contraseña por defecto. Cambiala tras el primer login o seteá SUPER_ADMIN_PASSWORD.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
