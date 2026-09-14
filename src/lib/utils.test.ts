import { describe, it, expect } from "vitest";
import { formatDate, formatFechaAR, formatMoney } from "./utils";

// El navegador y el servidor formatean la misma fecha y el texto tiene que
// coincidir caracter por caracter, o React tira "Hydration failed".

describe("formatDate", () => {
  it("usa horario argentino, no el del entorno", () => {
    // 19:39 UTC son las 16:39 en Argentina (UTC-3).
    expect(formatDate("2026-09-13T19:39:00Z")).toBe("13/09/2026, 16:39");
  });

  it("cruza bien la medianoche hacia el dia anterior", () => {
    // 01:30 UTC del 14 son las 22:30 del 13 en Argentina.
    expect(formatDate("2026-09-14T01:30:00Z")).toBe("13/09/2026, 22:30");
  });

  it("usa reloj de 24 horas y no imprime 24:00", () => {
    // 03:00 UTC son las 00:00 en Argentina.
    expect(formatDate("2026-09-14T03:00:00Z")).toBe("14/09/2026, 00:00");
  });

  it("no mete espacios raros de Intl", () => {
    // El bug original: el espacio antes de "p. m." era U+202F en ICU nuevo y
    // un espacio comun en otras versiones. Este regex solo acepta el comun.
    const salida = formatDate("2026-09-13T19:39:00Z");
    expect(salida).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/);
    expect(salida).not.toMatch(/[   ]/);
  });

  it("acepta Date ademas de string", () => {
    expect(formatDate(new Date("2026-09-13T19:39:00Z"))).toBe("13/09/2026, 16:39");
  });
});

describe("formatFechaAR", () => {
  it("devuelve solo la fecha, en horario argentino", () => {
    expect(formatFechaAR("2026-09-14T01:30:00Z")).toBe("13/09/2026");
  });

  it("no mete espacios raros", () => {
    expect(formatFechaAR("2026-09-13T19:39:00Z")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("formatMoney", () => {
  it("formatea con separador de miles y dos decimales", () => {
    expect(formatMoney(120000)).toBe("$ 120.000,00");
    expect(formatMoney(1234.5)).toBe("$ 1.234,50");
    expect(formatMoney(0)).toBe("$ 0,00");
  });

  it("acepta strings (los Decimal de Prisma llegan asi)", () => {
    expect(formatMoney("83000")).toBe("$ 83.000,00");
  });

  it("separa el simbolo con un espacio comun, no con U+00A0", () => {
    // Con `style: "currency"` Intl usaba un espacio duro que variaba entre
    // versiones de ICU y rompia la hidratacion.
    const salida = formatMoney(120000);
    expect(salida.charCodeAt(1)).toBe(32);
    expect(salida).not.toMatch(/[   ]/);
  });

  it("redondea a dos decimales", () => {
    expect(formatMoney(10.005)).toBe("$ 10,01");
    expect(formatMoney(10.004)).toBe("$ 10,00");
  });
});
