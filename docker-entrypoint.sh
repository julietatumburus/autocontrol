#!/bin/sh
set -e

echo "🔄 Aplicando esquema de base de datos (prisma db push)..."
npx prisma db push --skip-generate --accept-data-loss

# Crear la cuenta de super admin solo si SEED_ON_START=true.
# En producción sembramos únicamente el super admin (sin datos demo).
# Para cargar los datos demo completos, poné SEED_DEMO=true.
if [ "$SEED_ON_START" = "true" ]; then
  if [ "$SEED_DEMO" = "true" ]; then
    echo "🌱 Ejecutando seed con datos demo..."
    npx tsx prisma/seed.ts || echo "⚠️  El seed falló o ya estaba aplicado, continúo."
  else
    echo "👤 Creando super admin (sin datos demo)..."
    npx tsx prisma/seed-admin.ts || echo "⚠️  El seed de admin falló o ya estaba aplicado, continúo."
  fi
fi

echo "🚀 Iniciando Autocontrol en el puerto ${PORT:-3000}..."
exec npm run start
