/**
 * Generates PWA icons from favicon.svg using sharp (or a PNG fallback).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const iconsDir = path.join(publicDir, 'icons');
const svgPath = path.join(publicDir, 'favicon.svg');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

fs.mkdirSync(iconsDir, { recursive: true });

const svg = fs.readFileSync(svgPath);

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('sharp not installed — writing SVG copies as placeholders');
    for (const size of sizes) {
      fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), svg);
    }
    fs.writeFileSync(path.join(iconsDir, 'icon-512-maskable.png'), svg);
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), svg);
    return;
  }

  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`icon-${size}.png`);
  }

  // Maskable: full-bleed with padding-safe content
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512-maskable.png'));

  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Icons generated');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
