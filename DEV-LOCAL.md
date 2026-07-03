# 🖥️ Cómo correr Autocontrol localmente (sin Docker)

Esta máquina **no tiene Docker**, pero sí los binarios de PostgreSQL 13.
Para el preview local levantamos una **instancia propia de Postgres en el puerto 5433**
(independiente del Postgres del sistema en el 5432, no requiere admin).

## ▶️ Arrancar todo (después de reiniciar la PC)

```powershell
# 1. Arrancar la instancia de Postgres (puerto 5433)
& "C:\Program Files\PostgreSQL\13\bin\pg_ctl.exe" `
  -D "C:\Users\nicor\autocontrol-pgdata" `
  -l "C:\Users\nicor\autocontrol-pgdata\server.log" `
  -o "-p 5433" start
```

```bash
# 2. Arrancar la app (en la carpeta del proyecto)
npm run dev
```

Abrí http://localhost:3000

## ⏹️ Detener Postgres
```powershell
& "C:\Program Files\PostgreSQL\13\bin\pg_ctl.exe" -D "C:\Users\nicor\autocontrol-pgdata" stop
```

## 🔌 Conexión (.env)
```
DATABASE_URL="postgresql://postgres:autocontrol@localhost:5433/autocontrol?schema=public"
```

## 🔁 Resetear los datos demo
```bash
npx prisma db push --force-reset --skip-generate
npm run db:seed
```

## 👤 Usuarios demo (contraseña: autocontrol123)
- Super admin: `admin@autocontrol.app`
- Taller (admin): `taller@autocontrol.app`
- Empleado: `empleado@autocontrol.app`
- Cliente: `cliente@autocontrol.app`

> Cuando instales Docker Desktop, podés usar en su lugar `docker compose up -d db`
> y apuntar `DATABASE_URL` al puerto 5432 (ver README.md).
