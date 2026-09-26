// Builds circular logo + app icons from scripts/assets/logo-source.jpg.
// Run: node scripts/build-brand-assets.mjs
import sharp from "sharp";

const SRC = "scripts/assets/logo-source.jpg";
const CX = 383, CY = 378, R = 358; // circle of the badge inside the source photo

const size = R * 2;
const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${R}" cy="${R}" r="${R}" fill="#fff"/></svg>`);
const circle = await sharp(SRC)
  .extract({ left: CX - R, top: CY - R, width: size, height: size })
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

for (const px of [96, 192, 512]) {
  await sharp(circle).resize(px, px).webp({ quality: 88 }).toFile(`public/brand/logo-${px}.webp`);
}
await sharp(circle).resize(512, 512).png({ compressionLevel: 9 }).toFile("public/brand/logo-512.png");
// Favicon / app icons (opaque charcoal background for iOS).
await sharp(circle).resize(64, 64).png().toFile("src/app/icon.png");
await sharp({ create: { width: 180, height: 180, channels: 4, background: "#0c0a09" } })
  .composite([{ input: await sharp(circle).resize(172, 172).toBuffer(), left: 4, top: 4 }])
  .png()
  .toFile("src/app/apple-icon.png");
console.log("brand assets written");
