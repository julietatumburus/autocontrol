// Genera el logo de la app + favicon + íconos del PWA desde el archivo de marca.
// `sharp` ya no figura en devDependencies: teniamos un pin (^0.35.2) por debajo
// de lo que pide next (^0.35.4), y ese conflicto ensucio el lockfile. Igual
// sigue disponible, porque next la trae como dependencia opcional, asi que
// este script funciona sin instalar nada. El try/catch es por si algun dia
// next deja de arrastrarla.
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("");
  console.error("No se encontro 'sharp', que este script usa para generar los iconos.");
  console.error("Instalala al vuelo y sacala despues:");
  console.error("");
  console.error("    npm i -D sharp && node scripts/setup-logo.js && npm uninstall sharp");
  console.error("");
  process.exit(1);
}
const path = require("path");

const SRC = "C:/Users/nicor/Downloads/file_000000003918720e898df5a9f0f20488.png";
const pub = path.join(__dirname, "..", "public");
const appDir = path.join(__dirname, "..", "src", "app");

async function main() {
  // Logo completo para usar en la app (se recorta a círculo por CSS)
  await sharp(SRC).resize(512, 512, { fit: "cover" }).png()
    .toFile(path.join(pub, "autocontrol-logo.png"));

  // Íconos del PWA (fondo negro full-bleed, ideal para maskable)
  for (const size of [192, 512]) {
    await sharp(SRC).resize(size, size, { fit: "cover" })
      .flatten({ background: "#000000" }).png()
      .toFile(path.join(pub, `icon-${size}.png`));
  }
  await sharp(SRC).resize(180, 180, { fit: "cover" })
    .flatten({ background: "#000000" }).png()
    .toFile(path.join(pub, "apple-icon.png"));

  // Favicon (app/icon.png)
  await sharp(SRC).resize(256, 256, { fit: "cover" })
    .flatten({ background: "#000000" }).png()
    .toFile(path.join(appDir, "icon.png"));

  console.log("✓ autocontrol-logo.png, icon-192/512.png, apple-icon.png, app/icon.png");
}

main();
