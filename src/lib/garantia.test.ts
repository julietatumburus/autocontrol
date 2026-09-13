import { describe, it, expect } from "vitest";
import { estadoGarantia } from "./garantia";

describe("estadoGarantia", () => {
  it("suma los meses conservando el día", () => {
    const { fin } = estadoGarantia("2026-03-15T10:00:00Z", 12);
    expect(fin.getFullYear()).toBe(2027);
    expect(fin.getMonth()).toBe(2); // marzo
    expect(fin.getDate()).toBe(15);
  });

  it("recorta al último día cuando el mes destino es más corto", () => {
    // 31 de enero + 1 mes: con setMonth a secas daba 3 de marzo.
    const { fin } = estadoGarantia("2026-01-31T10:00:00Z", 1);
    expect(fin.getMonth()).toBe(1); // febrero
    expect(fin.getDate()).toBe(28); // 2026 no es bisiesto
  });

  it("respeta los años bisiestos", () => {
    const { fin } = estadoGarantia("2028-01-31T10:00:00Z", 1);
    expect(fin.getMonth()).toBe(1);
    expect(fin.getDate()).toBe(29);
  });

  it("marca la garantía vencida cuando pasó el plazo", () => {
    const g = estadoGarantia(
      "2026-01-10T00:00:00Z",
      6,
      new Date("2026-09-10T00:00:00Z"),
    );
    expect(g.vigente).toBe(false);
    expect(g.diasRestantes).toBe(0);
    expect(g.progreso).toBe(100);
  });

  it("informa los días restantes mientras está vigente", () => {
    const g = estadoGarantia(
      "2026-09-01T00:00:00Z",
      1,
      new Date("2026-09-10T00:00:00Z"),
    );
    expect(g.vigente).toBe(true);
    expect(g.diasRestantes).toBe(21);
    expect(g.progreso).toBeGreaterThan(0);
    expect(g.progreso).toBeLessThan(100);
  });
});
