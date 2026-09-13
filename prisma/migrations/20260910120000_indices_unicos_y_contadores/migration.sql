-- Endurecimiento del modelo: índices únicos que impiden la doble reserva de
-- turnos y los vehículos duplicados, más el contador atómico de numeración.
--
-- No alcanza con el DDL: la versión anterior permitía justamente los datos que
-- estos índices prohíben, así que primero hay que limpiarlos. Cada paso deja la
-- base consistente antes de crear el índice correspondiente.

-- ─────────────────────────────────────────────────────────────
-- 1. Turno.slotKey — reserva del horario a nivel base
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "Turno" ADD COLUMN "slotKey" TEXT;

-- Backfill de los turnos futuros que siguen vivos. Si un horario quedó tomado
-- dos veces (la versión anterior lo permitía), solo el primero en reservar se
-- queda con la clave; el resto conserva su turno pero con slotKey en NULL, que
-- no ocupa lugar en el índice único.
--
-- El formato tiene que coincidir carácter por carácter con el Date.toISOString()
-- de JavaScript, que es lo que genera la aplicación: 2027-03-01T13:00:00.000Z
UPDATE "Turno" t
SET "slotKey" =
  t."tallerId" || '|' ||
  to_char(t."fechaHora" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
WHERE t."estado" <> 'CANCELADO'
  AND t."fechaHora" > now()
  AND t."id" = (
    SELECT t2."id"
    FROM "Turno" t2
    WHERE t2."tallerId" = t."tallerId"
      AND t2."fechaHora" = t."fechaHora"
      AND t2."estado" <> 'CANCELADO'
    ORDER BY t2."creadoEn", t2."id"
    LIMIT 1
  );

CREATE UNIQUE INDEX "Turno_slotKey_key" ON "Turno"("slotKey");

-- ─────────────────────────────────────────────────────────────
-- 2. Vehiculo — un auto por cliente y patente
-- ─────────────────────────────────────────────────────────────
-- La versión anterior creaba un vehículo nuevo en cada ingreso al taller, así
-- que el mismo auto puede estar repetido. Nos quedamos con el más antiguo y
-- reapuntamos sus órdenes antes de borrar los duplicados: así no se pierde
-- ninguna orden ni su historial.
CREATE TEMP TABLE _vehiculos_dup AS
SELECT
  "id",
  FIRST_VALUE("id") OVER (
    PARTITION BY "clienteId", "patente"
    ORDER BY "creadoEn", "id"
  ) AS "conservar"
FROM "Vehiculo";

UPDATE "OrdenDeTrabajo" o
SET "vehiculoId" = d."conservar"
FROM "_vehiculos_dup" d
WHERE o."vehiculoId" = d."id"
  AND d."id" <> d."conservar";

DELETE FROM "Vehiculo"
WHERE "id" IN (
  SELECT "id" FROM "_vehiculos_dup" WHERE "id" <> "conservar"
);

DROP TABLE "_vehiculos_dup";

CREATE UNIQUE INDEX "Vehiculo_clienteId_patente_key" ON "Vehiculo"("clienteId", "patente");

-- ─────────────────────────────────────────────────────────────
-- 3. Contador — numeración atómica por taller
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "Contador" (
    "id" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Contador_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contador_tallerId_tipo_key" ON "Contador"("tallerId", "tipo");

-- Arrancar los contadores en cero repetiría números ya emitidos y chocaría con
-- el UNIQUE de "numero". Los inicializamos con el mayor número ya usado por
-- cada taller, leyéndolo del sufijo del comprobante (formato AC-XXXXX-0007).
INSERT INTO "Contador" ("id", "tallerId", "tipo", "valor")
SELECT
  gen_random_uuid()::text,
  o."tallerId",
  'COMPROBANTE',
  MAX(COALESCE(NULLIF(split_part(c."numero", '-', 3), '')::int, 0))
FROM "Comprobante" c
JOIN "OrdenDeTrabajo" o ON o."id" = c."ordenId"
GROUP BY o."tallerId";

INSERT INTO "Contador" ("id", "tallerId", "tipo", "valor")
SELECT
  gen_random_uuid()::text,
  o."tallerId",
  'PRESUPUESTO',
  MAX(COALESCE(NULLIF(split_part(p."numero", '-', 3), '')::int, 0))
FROM "Presupuesto" p
JOIN "OrdenDeTrabajo" o ON o."id" = p."ordenId"
GROUP BY o."tallerId";
