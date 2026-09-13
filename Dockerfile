# ─────────────────────────────────────────────────────────────
# Autocontrol — Dockerfile para Coolify
# ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base
# OpenSSL es necesario para los motores de Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── Dependencias ──
FROM base AS deps
COPY package.json package-lock.json* ./
# El postinstall corre `prisma generate`, que necesita el schema presente.
COPY prisma ./prisma
RUN npm ci

# ── Build ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Runner (producción) ──
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Las imágenes (fotos de avance y logos) se guardan en disco, no en la base.
# ⚠️ En Coolify hay que montar un volumen persistente en esta ruta: sin eso las
# imágenes se pierden en cada despliegue.
ENV UPLOADS_DIR=/app/uploads
RUN mkdir -p /app/uploads

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

VOLUME ["/app/uploads"]
EXPOSE 3000

# Al arrancar: aplica el esquema a la base y levanta Next.
ENTRYPOINT ["./docker-entrypoint.sh"]
