import { describe, it, expect } from "vitest";
import {
  estaCerrada,
  puedeCambiarEtapa,
  puedeModificarItems,
  puedeCobrar,
  puedeEntregar,
} from "./orden-estado";

describe("estaCerrada", () => {
  it("da por cerradas las órdenes pagadas, entregadas y canceladas", () => {
    expect(estaCerrada("PAGADA")).toBe(true);
    expect(estaCerrada("ENTREGADA")).toBe(true);
    expect(estaCerrada("CANCELADA")).toBe(true);
  });

  it("deja abiertas las que siguen en curso", () => {
    expect(estaCerrada("ABIERTA")).toBe(false);
    expect(estaCerrada("LISTA")).toBe(false);
  });
});

describe("puedeCambiarEtapa", () => {
  it("permite avanzar mientras la orden está en curso", () => {
    expect(puedeCambiarEtapa("ABIERTA").ok).toBe(true);
    expect(puedeCambiarEtapa("LISTA").ok).toBe(true);
  });

  it("no deja mover una orden ya cobrada", () => {
    // El bug original: avanzar una etapa devolvía la orden a ABIERTA y se
    // perdía el registro de que estaba pagada.
    const r = puedeCambiarEtapa("PAGADA");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/cerrada/i);
  });

  it("no deja mover una orden entregada ni cancelada", () => {
    expect(puedeCambiarEtapa("ENTREGADA").ok).toBe(false);
    expect(puedeCambiarEtapa("CANCELADA").ok).toBe(false);
  });
});

describe("puedeModificarItems", () => {
  it("permite cargar ítems mientras la orden sigue viva", () => {
    expect(puedeModificarItems("ABIERTA").ok).toBe(true);
    expect(puedeModificarItems("LISTA").ok).toBe(true);
  });

  it("bloquea los cambios después de cobrar", () => {
    expect(puedeModificarItems("PAGADA").ok).toBe(false);
    expect(puedeModificarItems("ENTREGADA").ok).toBe(false);
  });
});

describe("puedeCobrar", () => {
  const base = { totalEsPositivo: true, yaTieneComprobante: false };

  it("cobra una orden lista con total cargado", () => {
    expect(puedeCobrar({ ...base, estado: "LISTA" }).ok).toBe(true);
  });

  it("no cobra dos veces la misma orden", () => {
    const r = puedeCobrar({ ...base, estado: "LISTA", yaTieneComprobante: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/comprobante/i);
  });

  it("no cobra una orden que todavía está en reparación", () => {
    const r = puedeCobrar({ ...base, estado: "ABIERTA" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/lista para retirar/i);
  });

  it("no cobra una orden cancelada", () => {
    expect(puedeCobrar({ ...base, estado: "CANCELADA" }).ok).toBe(false);
  });

  it("no cobra si no hay ítems cargados", () => {
    const r = puedeCobrar({ ...base, estado: "LISTA", totalEsPositivo: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/ítems/i);
  });

  it("no vuelve a cobrar una orden ya pagada", () => {
    expect(puedeCobrar({ ...base, estado: "PAGADA" }).ok).toBe(false);
  });
});

describe("puedeEntregar", () => {
  it("entrega solo después de registrar el pago", () => {
    expect(puedeEntregar("PAGADA").ok).toBe(true);
  });

  it("no entrega una orden sin cobrar", () => {
    const r = puedeEntregar("LISTA");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/pago/i);
  });

  it("no entrega dos veces", () => {
    expect(puedeEntregar("ENTREGADA").ok).toBe(false);
  });
});
