import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { consumir, devolver, mensajeEspera } from "./rate-limit";

let n = 0;
/** Una clave distinta por test: el contador vive en el módulo. */
const clave = () => `test-${n++}`;

describe("consumir", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("permite hasta el límite y bloquea el siguiente", () => {
    const k = clave();
    expect(consumir(k, 3, 60_000).permitido).toBe(true);
    expect(consumir(k, 3, 60_000).permitido).toBe(true);
    const tercero = consumir(k, 3, 60_000);
    expect(tercero.permitido).toBe(true);
    expect(tercero.restantes).toBe(0);

    const cuarto = consumir(k, 3, 60_000);
    expect(cuarto.permitido).toBe(false);
    expect(cuarto.esperaSegundos).toBeGreaterThan(0);
  });

  it("libera intentos cuando la ventana se corre", () => {
    const k = clave();
    consumir(k, 2, 60_000);
    consumir(k, 2, 60_000);
    expect(consumir(k, 2, 60_000).permitido).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(consumir(k, 2, 60_000).permitido).toBe(true);
  });

  it("cuenta cada clave por separado", () => {
    const a = clave();
    const b = clave();
    consumir(a, 1, 60_000);
    expect(consumir(a, 1, 60_000).permitido).toBe(false);
    expect(consumir(b, 1, 60_000).permitido).toBe(true);
  });

  it("devolver limpia el contador (login exitoso)", () => {
    const k = clave();
    consumir(k, 1, 60_000);
    expect(consumir(k, 1, 60_000).permitido).toBe(false);
    devolver(k);
    expect(consumir(k, 1, 60_000).permitido).toBe(true);
  });
});

describe("mensajeEspera", () => {
  it("usa segundos para esperas cortas", () => {
    expect(
      mensajeEspera({ permitido: false, restantes: 0, esperaSegundos: 30 }),
    ).toContain("30 segundos");
  });

  it("usa minutos para esperas largas", () => {
    expect(
      mensajeEspera({ permitido: false, restantes: 0, esperaSegundos: 600 }),
    ).toContain("10 minutos");
  });
});
