import { describe, it, expect } from "vitest";
import { fechaHoraInstant, weekdayDe, slotsDisponibles } from "./agenda";

const taller = {
  agendaApertura: "09:00",
  agendaCierre: "12:00",
  agendaDuracionMin: 60,
  agendaDias: [1, 2, 3, 4, 5],
};

describe("fechaHoraInstant", () => {
  it("interpreta la hora en horario argentino (UTC-3)", () => {
    // 09:00 en Argentina son las 12:00 UTC.
    expect(fechaHoraInstant("2026-09-14", "09:00").toISOString()).toBe(
      "2026-09-14T12:00:00.000Z",
    );
  });
});

describe("weekdayDe", () => {
  it("devuelve el día de la semana con domingo en 0", () => {
    expect(weekdayDe("2026-09-14")).toBe(1); // lunes
    expect(weekdayDe("2026-09-13")).toBe(0); // domingo
    expect(weekdayDe("2026-09-19")).toBe(6); // sábado
  });
});

describe("slotsDisponibles", () => {
  const antes = new Date("2026-09-13T00:00:00Z"); // el día anterior

  it("genera la grilla entre apertura y cierre", () => {
    expect(slotsDisponibles(taller, "2026-09-14", new Set(), antes)).toEqual([
      "09:00",
      "10:00",
      "11:00",
    ]);
  });

  it("no ofrece un slot que no entra completo antes del cierre", () => {
    const corto = { ...taller, agendaDuracionMin: 45 };
    expect(slotsDisponibles(corto, "2026-09-14", new Set(), antes)).toEqual([
      "09:00",
      "09:45",
      "10:30",
      "11:15",
    ]);
  });

  it("descarta los horarios ya ocupados", () => {
    const ocupados = new Set([
      fechaHoraInstant("2026-09-14", "10:00").toISOString(),
    ]);
    expect(slotsDisponibles(taller, "2026-09-14", ocupados, antes)).toEqual([
      "09:00",
      "11:00",
    ]);
  });

  it("descarta los horarios que ya pasaron", () => {
    const ahora = new Date("2026-09-14T13:30:00Z"); // 10:30 en Argentina
    expect(slotsDisponibles(taller, "2026-09-14", new Set(), ahora)).toEqual([
      "11:00",
    ]);
  });
});
