-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TALLER', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TallerRole" AS ENUM ('ADMIN', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "TallerEstado" AS ENUM ('PENDIENTE', 'ACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "OrdenEstado" AS ENUM ('ABIERTA', 'LISTA', 'PAGADA', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ItemTipo" AS ENUM ('REPUESTO', 'PRODUCTO', 'MANO_OBRA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateEnum
CREATE TYPE "PresupuestoEstado" AS ENUM ('ENVIADO', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TurnoTipo" AS ENUM ('PRESUPUESTO', 'VISITA', 'OCUPADO');

-- CreateEnum
CREATE TYPE "TurnoEstado" AS ENUM ('SOLICITADO', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "NotificacionTipo" AS ENUM ('ORDEN_CREADA', 'ETAPA_ACTUALIZADA', 'ORDEN_LISTA', 'PAGO_REGISTRADO', 'COMPROBANTE_EMITIDO', 'PRESUPUESTO_ENVIADO', 'PRESUPUESTO_APROBADO', 'PRESUPUESTO_RECHAZADO', 'MENSAJE_NUEVO', 'TURNO_CREADO', 'TURNO_RECORDATORIO', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "dni" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taller" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "logoUrl" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "estado" "TallerEstado" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "agendaActiva" BOOLEAN NOT NULL DEFAULT true,
    "agendaApertura" TEXT NOT NULL DEFAULT '09:00',
    "agendaCierre" TEXT NOT NULL DEFAULT '18:00',
    "agendaDuracionMin" INTEGER NOT NULL DEFAULT 30,
    "agendaDias" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "garantiaActiva" BOOLEAN NOT NULL DEFAULT false,
    "garantiaMeses" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "Taller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TallerMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,
    "role" "TallerRole" NOT NULL DEFAULT 'EMPLEADO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TallerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioDesde" DECIMAL(12,2),

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaCatalogo" (
    "id" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "esFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EtapaCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER,
    "patente" TEXT NOT NULL,
    "color" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenDeTrabajo" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "tallerId" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "estado" "OrdenEstado" NOT NULL DEFAULT 'ABIERTA',
    "etapaActualId" TEXT,
    "descripcionProblema" TEXT,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "listaEn" TIMESTAMP(3),
    "entregadaEn" TIMESTAMP(3),
    "vistoClienteEn" TIMESTAMP(3),
    "vistoTallerEn" TIMESTAMP(3),

    CONSTRAINT "OrdenDeTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenEtapa" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "etapaCatalogoId" TEXT,
    "nombre" TEXT NOT NULL,
    "nota" TEXT,
    "ingresoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salidaEn" TIMESTAMP(3),
    "registradoPorId" TEXT,

    CONSTRAINT "OrdenEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAplicado" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "ordenEtapaId" TEXT,
    "tipo" "ItemTipo" NOT NULL DEFAULT 'REPUESTO',
    "nombre" TEXT NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "precioUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "registradoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemAplicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "nota" TEXT,
    "registradoPorId" TEXT,
    "pagadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprobante" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "detalle" JSONB NOT NULL,
    "emitidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ordenId" TEXT,
    "tipo" "NotificacionTipo" NOT NULL DEFAULT 'GENERAL',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leidaEn" TIMESTAMP(3),
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "estado" "PresupuestoEstado" NOT NULL DEFAULT 'ENVIADO',
    "total" DECIMAL(12,2) NOT NULL,
    "detalle" JSONB NOT NULL,
    "nota" TEXT,
    "motivoRechazo" TEXT,
    "clienteNombre" TEXT NOT NULL,
    "clienteDni" TEXT,
    "tallerNombre" TEXT NOT NULL,
    "tallerFirmante" TEXT,
    "tallerDni" TEXT,
    "enviadoPorId" TEXT,
    "enviadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoEn" TIMESTAMP(3),

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenFoto" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "etapaNombre" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdenFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,
    "clienteId" TEXT,
    "tipo" "TurnoTipo" NOT NULL DEFAULT 'PRESUPUESTO',
    "estado" "TurnoEstado" NOT NULL DEFAULT 'SOLICITADO',
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "vehiculo" TEXT,
    "motivo" TEXT,
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Taller_slug_key" ON "Taller"("slug");

-- CreateIndex
CREATE INDEX "Taller_estado_idx" ON "Taller"("estado");

-- CreateIndex
CREATE INDEX "TallerMember_tallerId_idx" ON "TallerMember"("tallerId");

-- CreateIndex
CREATE UNIQUE INDEX "TallerMember_userId_tallerId_key" ON "TallerMember"("userId", "tallerId");

-- CreateIndex
CREATE INDEX "Servicio_tallerId_idx" ON "Servicio"("tallerId");

-- CreateIndex
CREATE INDEX "EtapaCatalogo_tallerId_idx" ON "EtapaCatalogo"("tallerId");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaCatalogo_tallerId_orden_key" ON "EtapaCatalogo"("tallerId", "orden");

-- CreateIndex
CREATE INDEX "Vehiculo_clienteId_idx" ON "Vehiculo"("clienteId");

-- CreateIndex
CREATE INDEX "Vehiculo_patente_idx" ON "Vehiculo"("patente");

-- CreateIndex
CREATE INDEX "OrdenDeTrabajo_tallerId_estado_idx" ON "OrdenDeTrabajo"("tallerId", "estado");

-- CreateIndex
CREATE INDEX "OrdenDeTrabajo_clienteId_idx" ON "OrdenDeTrabajo"("clienteId");

-- CreateIndex
CREATE INDEX "OrdenEtapa_ordenId_idx" ON "OrdenEtapa"("ordenId");

-- CreateIndex
CREATE INDEX "ItemAplicado_ordenId_idx" ON "ItemAplicado"("ordenId");

-- CreateIndex
CREATE INDEX "Pago_ordenId_idx" ON "Pago"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_pagoId_key" ON "Comprobante"("pagoId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_numero_key" ON "Comprobante"("numero");

-- CreateIndex
CREATE INDEX "Comprobante_ordenId_idx" ON "Comprobante"("ordenId");

-- CreateIndex
CREATE INDEX "Notificacion_userId_leidaEn_idx" ON "Notificacion"("userId", "leidaEn");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_numero_key" ON "Presupuesto"("numero");

-- CreateIndex
CREATE INDEX "Presupuesto_ordenId_idx" ON "Presupuesto"("ordenId");

-- CreateIndex
CREATE INDEX "Mensaje_ordenId_creadoEn_idx" ON "Mensaje"("ordenId", "creadoEn");

-- CreateIndex
CREATE INDEX "OrdenFoto_ordenId_creadoEn_idx" ON "OrdenFoto"("ordenId", "creadoEn");

-- CreateIndex
CREATE INDEX "Turno_tallerId_fechaHora_idx" ON "Turno"("tallerId", "fechaHora");

-- CreateIndex
CREATE INDEX "Turno_clienteId_idx" ON "Turno"("clienteId");

-- CreateIndex
CREATE INDEX "Turno_estado_recordatorioEnviado_idx" ON "Turno"("estado", "recordatorioEnviado");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TallerMember" ADD CONSTRAINT "TallerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TallerMember" ADD CONSTRAINT "TallerMember_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaCatalogo" ADD CONSTRAINT "EtapaCatalogo_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenDeTrabajo" ADD CONSTRAINT "OrdenDeTrabajo_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenDeTrabajo" ADD CONSTRAINT "OrdenDeTrabajo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenDeTrabajo" ADD CONSTRAINT "OrdenDeTrabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenDeTrabajo" ADD CONSTRAINT "OrdenDeTrabajo_etapaActualId_fkey" FOREIGN KEY ("etapaActualId") REFERENCES "EtapaCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenDeTrabajo" ADD CONSTRAINT "OrdenDeTrabajo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenEtapa" ADD CONSTRAINT "OrdenEtapa_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenEtapa" ADD CONSTRAINT "OrdenEtapa_etapaCatalogoId_fkey" FOREIGN KEY ("etapaCatalogoId") REFERENCES "EtapaCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenEtapa" ADD CONSTRAINT "OrdenEtapa_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAplicado" ADD CONSTRAINT "ItemAplicado_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAplicado" ADD CONSTRAINT "ItemAplicado_ordenEtapaId_fkey" FOREIGN KEY ("ordenEtapaId") REFERENCES "OrdenEtapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAplicado" ADD CONSTRAINT "ItemAplicado_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenFoto" ADD CONSTRAINT "OrdenFoto_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenDeTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

