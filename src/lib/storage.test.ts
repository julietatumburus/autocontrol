import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";

let dir: string;

// El módulo lee UPLOADS_DIR al importarse, así que lo fijamos antes.
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "autocontrol-uploads-"));
  process.env.UPLOADS_DIR = dir;
});

afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const png = () =>
  new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "foto.png", {
    type: "image/png",
  });

describe("storage", () => {
  it("guarda el archivo en disco y lo devuelve igual", async () => {
    const { guardarImagen, leerImagen } = await import("./storage");

    const clave = await guardarImagen("fotos", png());
    expect(clave).toMatch(/^fotos\/[0-9a-f]{32}\.png$/);

    // El archivo existe de verdad, no quedó en la base.
    await expect(fs.stat(path.join(dir, clave))).resolves.toBeTruthy();

    const leida = await leerImagen(clave);
    expect(leida?.mime).toBe("image/png");
    expect(leida?.buf.length).toBe(8);
  });

  it("borra el archivo", async () => {
    const { guardarImagen, borrarImagen, leerImagen } = await import("./storage");
    const clave = await guardarImagen("fotos", png());
    await borrarImagen(clave);
    expect(await leerImagen(clave)).toBeNull();
  });

  it("sigue leyendo las data URL de la versión anterior", async () => {
    const { leerImagen } = await import("./storage");
    const legado = "data:image/png;base64,aGVsbG8=";
    const leida = await leerImagen(legado);
    expect(leida?.mime).toBe("image/png");
    expect(leida?.buf.toString()).toBe("hello");
  });

  it("no deja escapar de la carpeta de subidas", async () => {
    const { leerImagen } = await import("./storage");
    expect(await leerImagen("../../../etc/passwd")).toBeNull();
    expect(await leerImagen("/etc/passwd")).toBeNull();
    expect(await leerImagen("fotos/../../secreto.txt")).toBeNull();
  });

  it("rechaza formatos que no son imagen", async () => {
    const { guardarImagen, mimeAceptado } = await import("./storage");
    expect(mimeAceptado("application/pdf")).toBe(false);
    expect(mimeAceptado("image/png")).toBe(true);

    const pdf = new File([new Uint8Array([1])], "x.pdf", {
      type: "application/pdf",
    });
    await expect(guardarImagen("fotos", pdf)).rejects.toThrow(/no soportado/i);
  });
});
