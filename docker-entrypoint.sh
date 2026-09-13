#!/bin/sh
set -e

# ─────────────────────────────────────────────────────────────
# Esquema de base de datos
# ─────────────────────────────────────────────────────────────
# El esquema se versiona con migraciones (prisma/migrations/). Se aplican con
# `migrate deploy`, que nunca borra datos por su cuenta: si una migración no
# puede aplicarse, el arranque falla en vez de seguir con la base a medias.
aplicar_migraciones() {
  echo "🔄 Aplicando migraciones (prisma migrate deploy)..."
  salida=$(npx prisma migrate deploy 2>&1) || estado=$?
  echo "$salida"

  # P3005: la base ya tiene tablas pero no tiene historial de migraciones.
  # Es el caso de una instalación anterior, creada con `prisma db push`. Hay
  # que decirle a Prisma que el esquema que ya está puesto equivale a la
  # primera migración (baseline); si no, intentaría crear tablas existentes.
  if echo "$salida" | grep -q "P3005"; then
    echo ""
    echo "ℹ️  Base preexistente sin historial de migraciones."
    echo "   Marcando '0_init' como ya aplicada (baseline) y reintentando."
    echo ""
    npx prisma migrate resolve --applied 0_init
    npx prisma migrate deploy
    return 0
  fi

  if [ -n "$estado" ] && [ "$estado" -ne 0 ]; then
    echo ""
    echo "❌ No se pudieron aplicar las migraciones. La app no arranca."
    echo "   Revisá el error de arriba antes de reintentar el despliegue."
    return 1
  fi
}

if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  aplicar_migraciones
else
  # Sin migraciones versionadas (no debería pasar en producción): se sincroniza
  # el esquema SIN `--accept-data-loss`, para que un cambio destructivo frene
  # el arranque en vez de borrar columnas con datos en silencio.
  echo "🔄 Sincronizando esquema (prisma db push)..."
  npx prisma db push --skip-generate
fi

# ─────────────────────────────────────────────────────────────
# Datos iniciales
# ─────────────────────────────────────────────────────────────
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
