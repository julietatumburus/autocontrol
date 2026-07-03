#!/bin/sh
set -e

echo "🔄 Aplicando esquema de base de datos (prisma db push)..."
npx prisma db push --skip-generate --accept-data-loss

# Sembrar datos demo solo si SEED_ON_START=true
if [ "$SEED_ON_START" = "true" ]; then
  echo "🌱 Ejecutando seed..."
  npx tsx prisma/seed.ts || echo "⚠️  El seed falló o ya estaba aplicado, continúo."
fi

echo "🚀 Iniciando Autocontrol en el puerto ${PORT:-3000}..."
exec npm run start
