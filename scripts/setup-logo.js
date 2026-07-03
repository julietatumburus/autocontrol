// Genera el logo de la app + favicon + íconos del PWA desde el archivo de marca.
const sharp = require("sharp");
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
