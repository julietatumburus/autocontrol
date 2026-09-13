import type { OrdenEstado } from "@prisma/client";

// Reglas de qué se puede hacer con una orden según su estado.
//
// Estaban sueltas dentro de las server actions —o directamente no estaban: se
// podía mover de etapa una orden ya cobrada (y volvía a ABIERTA, perdiendo el
// pago) o registrar un pago sobre una orden que todavía no había terminado.
// Acá viven juntas y se pueden testear sin base de datos.

export type Permiso = { ok: true } | { ok: false; motivo: string };

const OK: Permiso = { ok: true };
const no = (motivo: string): Permiso => ({ ok: false, motivo });

/** Una orden cerrada ya no admite cambios operativos. */
export function estaCerrada(estado: OrdenEstado): boolean {
  return estado === "PAGADA" || estado === "ENTREGADA" || estado === "CANCELADA";
}

/** ¿Se puede mover la orden de etapa? */
export function puedeCambiarEtapa(estado: OrdenEstado): Permiso {
  if (estaCerrada(estado)) {
    return no(
      "La orden ya está cerrada (pagada, entregada o cancelada): no se puede cambiar de etapa.",
    );
  }
  return OK;
}

/** ¿Se pueden agregar o quitar ítems (repuestos, mano de obra)? */
export function puedeModificarItems(estado: OrdenEstado): Permiso {
  if (estaCerrada(estado)) {
    return no("La orden ya está cerrada: no se pueden modificar los ítems.");
  }
  return OK;
}

/**
 * ¿Se puede registrar el pago?
 *
 * Solo una vez, solo sobre una orden terminada y solo si hay algo que cobrar.
 * La comparación del monto contra el total queda en la action, que trabaja con
 * el Decimal de Prisma.
 */
export function puedeCobrar(orden: {
  estado: OrdenEstado;
  totalEsPositivo: boolean;
  yaTieneComprobante: boolean;
}): Permiso {
  if (orden.yaTieneComprobante) {
    return no("Esta orden ya tiene un comprobante emitido.");
  }
  if (orden.estado === "CANCELADA") return no("La orden está cancelada.");
  if (orden.estado !== "LISTA") {
    return no(
      "La orden todavía no está lista para retirar: llevala a la etapa final antes de cobrarla.",
    );
  }
  if (!orden.totalEsPositivo) {
    return no("Cargá los ítems de la reparación antes de cobrar.");
  }
  return OK;
}

/** ¿Se puede marcar como entregada? Recién después de cobrar. */
export function puedeEntregar(estado: OrdenEstado): Permiso {
  if (estado === "ENTREGADA") return no("La orden ya fue entregada.");
  if (estado !== "PAGADA") {
    return no("Registrá el pago antes de entregar el vehículo.");
  }
  return OK;
}
