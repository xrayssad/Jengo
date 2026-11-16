import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../public");
const pin = "M22 78C22 78 3 56 3 38A19 19 0 1 1 41 38C41 56 22 78 22 78Z";
const house = "M13 40L22 31L31 40V48H13Z";

function iconSvg(rounded, scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="${rounded ? 20 : 0}" fill="#4F5A3A"/>
  <g transform="translate(40 40) scale(${scale}) translate(-22 -48.5)" fill="none" stroke="#F2EDE4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="${pin}"/>
    <path d="${house}" fill="#D4A95A" stroke="none"/>
  </g>
</svg>`;
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#14231A"/>
  <g transform="translate(600 210) scale(2.15) translate(-22 -48.5)" fill="none" stroke="#F2EDE4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="${pin}"/>
    <path d="${house}" fill="#D4A95A" stroke="none"/>
  </g>
  <g transform="translate(340 360)" fill="none" stroke="#F2EDE4" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 2V42C28 54 20 62 8 62"/>
    <path transform="translate(42 0)" d="M2 40H42A20 20 0 1 0 36 54"/>
    <path transform="translate(98 0)" d="M2 20V60M2 36C2 26 10 20 22 20C34 20 42 27 42 38V60"/>
    <g transform="translate(154 0)"><circle cx="22" cy="40" r="20"/><path d="M42 20V66C42 80 32 86 20 86C12 86 6 83 2 78"/></g>
    <g transform="translate(210 0)">
      <path d="${pin}"/>
      <path d="${house}" fill="#D4A95A" stroke="none"/>
    </g>
  </g>
</svg>`;

async function png(svg, file, size) {
  const image = sharp(Buffer.from(svg)).resize(size, size, { fit: "fill" });
  await image.png().toFile(resolve(root, file));
}

await mkdir(root, { recursive: true });
const mark = iconSvg(true, 1.05);
const mask = iconSvg(false, 0.8);
await writeFile(resolve(root, "icon.svg"), mark);
await png(mark, "favicon-32.png", 32);
await png(mark, "apple-touch-icon.png", 180);
await png(mark, "icon-192.png", 192);
await png(mark, "icon-512.png", 512);
await png(mask, "icon-maskable-512.png", 512);
await sharp(Buffer.from(og)).png().toFile(resolve(root, "og.png"));
console.log("wrote brand icons in", root);
