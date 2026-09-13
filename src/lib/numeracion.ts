import crypto from "crypto";
import type { Prisma } from "@prisma/client";

export type TipoContador = "COMPROBANTE" | "PRESUPUESTO";

const PREFIJO: Record<TipoContador, string> = {
  COMPROBANTE: "AC",
  PRESUPUESTO: "PR",
};

/**
 * Devuelve el próximo número de comprobante/presupuesto del taller.
 *
 * Antes se calculaba con `count() + 1`, que es una carrera: dos pagos
 * simultáneos leían el mismo total y generaban el mismo número, y como
 * `numero` es único la segunda transacción explotaba. El INSERT ... ON
 * CONFLICT DO UPDATE incrementa dentro de la base, así que el contador es
 * atómico incluso con varias peticiones a la vez.
 */
export async function siguienteNumero(
  tx: Prisma.TransactionClient,
  tallerId: string,
  tipo: TipoContador,
): Promise<string> {
  const filas = await tx.$queryRaw<{ valor: number }[]>`
    INSERT INTO "Contador" ("id", "tallerId", "tipo", "valor")
    VALUES (${crypto.randomUUID()}, ${tallerId}, ${tipo}, 1)
    ON CONFLICT ("tallerId", "tipo")
      DO UPDATE SET "valor" = "Contador"."valor" + 1
    RETURNING "valor"
  `;

  const valor = filas[0]?.valor ?? 1;
  const code = tallerId.slice(-5).toUpperCase();
  return `${PREFIJO[tipo]}-${code}-${String(valor).padStart(4, "0")}`;
}
