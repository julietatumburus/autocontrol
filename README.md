# 🚗 Autocontrol

Plataforma **multi-taller** de seguimiento de reparaciones. Conecta a los talleres con sus clientes: el cliente deja su auto y sigue en tiempo real cómo avanza la reparación, qué repuestos se aplican, cuánto va a pagar, recibe el aviso cuando está listo y obtiene su comprobante al abonar.

## ✨ Funcionalidades del MVP

- **Cara pública (Autocontrol):** landing con listado de talleres y perfil público de cada uno (servicios que ofrece).
- **Clientes:** cuenta propia (email + contraseña), seguimiento de la evolución por etapas, detalle de costos, avisos (in-app + email) y comprobante de servicio.
- **Talleres:** login y registro propios, panel con órdenes de trabajo, flujo por etapas, carga de repuestos/productos/mano de obra, registro de pago manual y emisión de comprobante.
- **Roles:** Super Admin (plataforma), Admin de taller, Empleado y Cliente.

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) + React 19 |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) — credenciales, sesiones JWT |
| UI | Tailwind CSS v4 |
| Email | Nodemailer (SMTP) |
| Deploy | Docker → Coolify |

---

## 🚀 Desarrollo local

### 1. Requisitos
- Node.js 20+ y npm
- Docker (para Postgres) — o un Postgres propio

### 2. Levantar la base de datos
```bash
docker compose up -d db
```

### 3. Instalar dependencias y preparar el esquema
```bash
npm install
cp .env.example .env   # ya hay un .env de ejemplo listo para local
npm run db:push        # crea las tablas en Postgres
npm run db:seed        # carga datos demo (opcional pero recomendado)
```

### 4. Correr la app
```bash
npm run dev
```
Abrí http://localhost:3000

### 👤 Usuarios demo (tras el seed)
Contraseña para todos: **`autocontrol123`**

| Rol | Email |
|-----|-------|
| Super Admin | `admin@autocontrol.app` |
| Admin de taller | `taller@autocontrol.app` |
| Empleado | `empleado@autocontrol.app` |
| Cliente | `cliente@autocontrol.app` |

> El cliente demo ya tiene una orden **en curso** para ver el seguimiento.

---

## 🐳 Correr todo con Docker (app + DB)
```bash
docker compose --profile full up --build
```
Esto levanta Postgres y la app (con `SEED_ON_START=true` para cargar los datos demo). Disponible en http://localhost:3000

---

## ☁️ Deploy en Coolify

1. **Creá un recurso PostgreSQL** en tu proyecto de Coolify. Anotá el host interno, usuario, contraseña y base.
2. **Creá una aplicación** apuntando a este repositorio. Coolify detecta el `Dockerfile` automáticamente.
3. **Configurá las variables de entorno** de la app (Environment):
   ```
   DATABASE_URL=postgresql://USER:PASS@HOST_INTERNO_POSTGRES:5432/autocontrol?schema=public
   AUTH_SECRET=<generá uno: openssl rand -base64 32>
   AUTH_TRUST_HOST=true
   NEXTAUTH_URL=https://tu-dominio.com
   SUPER_ADMIN_EMAIL=tu-email@dominio.com
   SUPER_ADMIN_PASSWORD=una-contraseña-fuerte   # opcional; default: autocontrol123
   # SMTP (opcional, para emails reales)
   SMTP_HOST=...
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASSWORD=...
   SMTP_FROM=Autocontrol <no-reply@tu-dominio.com>
   # Solo en el PRIMER deploy, para crear tu super admin:
   # SEED_ON_START=true
   # SEED_DEMO=true   # (opcional) además carga talleres/órdenes demo
   ```
4. **Deploy.** Al arrancar, el contenedor aplica el esquema (`prisma db push`) y levanta Next.js en el puerto **3000** (mapealo a tu dominio).
5. Para crear tu **super admin**, poné `SEED_ON_START=true` en el primer deploy. Por defecto crea **solo tu cuenta** de super admin (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`, o `autocontrol123` si no la definís). Quitá `SEED_ON_START` en los siguientes deploys. Si además querés los datos demo, sumá `SEED_DEMO=true`.

> **Nota de producción:** el arranque usa `prisma db push` (sincroniza el esquema sin historial de migraciones), ideal para el MVP. Cuando el modelo se estabilice, conviene pasar a migraciones (`prisma migrate`) y cambiar el entrypoint a `prisma migrate deploy`.

---

## 📁 Estructura

```
prisma/
  schema.prisma        # modelo de datos
  seed.ts              # datos demo
src/
  auth.ts, auth.config.ts, middleware.ts   # autenticación y protección de rutas
  app/
    (public)/          # landing + perfil de talleres (cara Autocontrol)
    login/ registro/   # acceso de clientes y talleres
    panel/             # panel del taller (órdenes, etapas, pagos, config)
    mi-cuenta/         # cuenta del cliente (seguimiento, avisos)
    admin/             # super admin (aprobar talleres)
    comprobante/[id]/  # comprobante de servicio imprimible
  components/          # UI compartida (Timeline, Cards, Nav…)
  lib/
    prisma.ts          # cliente Prisma
    actions/           # server actions (auth, ordenes, taller, admin, notif)
    notificaciones.ts  # avisos in-app + email
    mailer.ts          # envío SMTP
```

## 🔄 Flujo central

```
Cliente deja el auto → Empleado crea la orden (vehículo + cliente)
  → la orden avanza por etapas (Recibido → Diagnóstico → … → Listo)
  → se cargan repuestos/productos en cada etapa
  → el cliente ve la evolución en vivo
  → al llegar a "Listo": aviso al cliente + detalle del costo
  → el cliente paga en el taller → empleado registra el pago
  → se emite el comprobante de servicio
```
