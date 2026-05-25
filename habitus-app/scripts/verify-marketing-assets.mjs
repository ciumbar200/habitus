import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "src/assets/marketing/habitus-hero.jpg",
  "src/assets/marketing/habitus-listings-hero.jpg",
  "src/assets/marketing/habitus-host-hero.jpg",
  "src/assets/marketing/habitus-owner-hero.jpg",
  "src/assets/marketing/habitus-agency-hero.jpg",
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
  console.error("Faltan imágenes hero de marketing:\n" + missing.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
