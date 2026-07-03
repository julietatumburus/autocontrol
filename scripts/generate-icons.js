// Genera los íconos PNG del PWA desde una versión cuadrada (full-bleed) del isotipo.
// Uso: node scripts/generate-icons.js
const sharp = require("sharp");
const path = require("path");

const pub = path.join(__dirname, "..", "public");

// Isotipo cuadrado (sin esquinas redondeadas) para que sirva como maskable.
const svg = `<svg width="512" height="512" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0" stop-color="#3f5f98"/>
      <stop offset="1" stop-color="#1e3354"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" fill="url(#g)"/>
  <g fill="#ffffff" opacity="0.55">
    <rect x="6" y="19" width="6" height="1.8" rx="0.9"/>
    <rect x="5" y="23.5" width="7" height="1.8" rx="0.9"/>
    <rect x="7" y="28" width="5" height="1.8" rx="0.9"/>
  </g>
  <g fill="#ffffff">
    <path d="M15 23 L19 16.5 C19.4 15.7 20 15.5 21 15.5 L27 15.5 C28 15.5 28.6 15.7 29 16.5 L33 23 Z"/>
    <rect x="11" y="22" width="26" height="8" rx="3"/>
  </g>
  <g>
    <circle cx="17.5" cy="30" r="3.6" fill="#ffffff"/>
    <circle cx="17.5" cy="30" r="1.6" fill="url(#g)"/>
    <circle cx="30.5" cy="30" r="3.6" fill="#ffffff"/>
    <circle cx="30.5" cy="30" r="1.6" fill="url(#g)"/>
  </g>
</svg>`;

const buf = Buffer.from(svg);

async function main() {
  await sharp(buf, { density: 600 }).resize(192, 192).png().toFile(path.join(pub, "icon-192.png"));
  await sharp(buf, { density: 600 }).resize(512, 512).png().toFile(path.join(pub, "icon-512.png"));
  await sharp(buf, { density: 600 }).resize(180, 180).png().toFile(path.join(pub, "apple-icon.png"));
  console.log("Íconos generados: icon-192.png, icon-512.png, apple-icon.png");
}

main();
