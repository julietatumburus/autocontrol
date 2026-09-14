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

### 5. Tests y lint
```bash
npm test        # vitest: lógica pura (agenda, garantía, límites, estados de orden)
npm run lint    # eslint (flat config)
```

Las verificaciones que necesitan Postgres levantado van aparte:
```bash
npx tsx scripts/verificar-concurrencia.ts    # numeración, turnos, vehículos
npx tsx scripts/verificar-edicion-orden.ts   # edición y reasignación de órdenes
```

> **Íconos del PWA:** `scripts/generate-icons.js` y `scripts/setup-logo.js` usan
> `sharp`, que ya no figura en `devDependencies` (teníamos un pin por debajo de
> lo que pide Next y ensuciaba el lockfile). Igual está disponible porque Next
> la trae como dependencia opcional. Si algún día no estuviera, el script te
> dice cómo instalarla al vuelo.

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
   # Carpeta de imágenes (ver el aviso del volumen, más abajo)
   UPLOADS_DIR=/app/uploads
   # Recordatorios de turnos por cron
   CRON_SECRET=<generá uno: openssl rand -hex 32>
   # Solo en el PRIMER deploy, para crear tu super admin:
   # SEED_ON_START=true
   # SEED_DEMO=true   # (opcional) además carga talleres/órdenes demo
   ```
4. **Deploy.** Al arrancar, el contenedor aplica las migraciones (`prisma migrate deploy`) y levanta Next.js en el puerto **3000** (mapealo a tu dominio). Si actualizás una instalación que ya existía, leé antes la sección **Actualizar una instalación existente**.
5. Para crear tu **super admin**, poné `SEED_ON_START=true` en el primer deploy. Por defecto crea **solo tu cuenta** de super admin (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`, o `autocontrol123` si no la definís). Quitá `SEED_ON_START` en los siguientes deploys. Si además querés los datos demo, sumá `SEED_DEMO=true`.

> ### ⚠️ Volumen persistente para las imágenes
> Las fotos del avance y los logos de los talleres se guardan **en disco**, no en
> la base. En Coolify hay que montar un **volumen persistente en `/app/uploads`**
> (Storages → Add volume). Sin ese volumen, las imágenes se pierden en cada
> despliegue.
>
> Si venís de una versión anterior, las imágenes que ya estaban guardadas como
> data URL en la base **siguen funcionando**: la app detecta el formato viejo y
> lo sirve igual. Solo las nuevas van al disco.

---

## 🔁 Actualizar una instalación existente

El esquema pasó a usar **migraciones versionadas** (`prisma/migrations/`). El
contenedor ejecuta `prisma migrate deploy` al arrancar.

**Si la base es nueva**, no hay nada que hacer: el primer arranque aplica todas
las migraciones solo.

**Si la base ya tenía datos** (creada con `db push` por una versión anterior),
tampoco hay que hacer nada: el arranque lo detecta (error `P3005`), marca el
esquema existente como punto de partida y sigue. En los logs vas a ver:

```
ℹ️  Base preexistente sin historial de migraciones.
   Marcando '0_init' como ya aplicada (baseline) y reintentando.
```

Los despliegues siguientes no repiten el paso: si no hay migraciones nuevas,
el arranque solo informa `No pending migrations to apply`.

### Qué hace la migración con tus datos

La versión anterior permitía datos que el modelo nuevo prohíbe, así que la
migración los corrige antes de crear cada índice:

| Situación previa | Qué hace la migración |
|---|---|
| El mismo auto cargado varias veces (uno por ingreso al taller) | Conserva el más antiguo y **reapunta sus órdenes**; después borra los duplicados. No se pierde ninguna orden ni su historial. |
| Dos turnos en el mismo horario (doble reserva) | Ambos se conservan. Solo el primero en reservar pasa a ocupar el horario a nivel base. |
| Comprobantes y presupuestos ya emitidos | Inicializa los contadores con el último número usado por cada taller, para que la numeración **continúe** en vez de reiniciar y chocar. |

> Probado ejecutando el entrypoint real contra una base con vehículos
> triplicados, turnos doble-reservados y un comprobante `AC-XXXXX-0012`:
> 3 vehículos → 1, las 3 órdenes intactas y sin huérfanas, y el próximo
> comprobante quedó en `0013`. Un segundo arranque no vuelve a tocar nada.

**Hacé un backup de la base antes de actualizar.** La migración borra filas
duplicadas y eso no se deshace.

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
    orden-estado.ts    # reglas de qué se puede hacer según el estado de la orden
    numeracion.ts      # numeración atómica de comprobantes/presupuestos
    storage.ts         # imágenes en disco (fotos de avance, logos)
    rate-limit.ts      # límite de intentos (login, reset, turnos, consultas)
    diferido.ts        # tareas post-respuesta (envío de emails)
    notificaciones.ts  # avisos in-app + email
    mailer.ts          # envío SMTP (escapa el contenido del usuario)
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

Si al abrir la orden se cargó algo mal, el botón **Editar datos** del detalle
corrige vehículo, problema reportado y datos del cliente. Cambiar el email
**reasigna** la orden a esa cuenta (creándola si no existe) en vez de pisarle
el email al cliente actual, que es su usuario para entrar. Reasignar solo se
puede antes de cobrar: después hay un comprobante emitido a nombre de alguien.
