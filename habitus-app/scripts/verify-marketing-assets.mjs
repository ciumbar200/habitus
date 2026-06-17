import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "src/assets/hero.png",
  "public/brand/moon-logo-black.png",
  "public/brand/moon-logo-original.webp",
  "public/marketing/main-hero-v2.jpg",
  "public/marketing/explore-hero-v2.jpg",
  "public/marketing/host-hero-v2.jpg",
  "public/marketing/owner-hero-v2.jpg",
  "public/marketing/operator-hero-v2.jpg",
  "public/marketing/community-wait-v2.jpg",
  "public/hero-listings/barcelona-gracia.jpg",
  "public/hero-listings/madrid-centro.jpg",
  "public/hero-listings/barcelona-poblenou.jpg",
];

const missing = [];
for (const rel of required) {
  try {
    await access(path.join(root, rel));
  } catch {
    missing.push(rel);
  }
}

if (missing.length > 0) {
  console.warn("⚠️  Assets de marketing no encontrados (el build continúa):\n" + missing.map((f) => `  - ${f}`).join("\n"));
}
