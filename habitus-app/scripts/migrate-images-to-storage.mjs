/**
 * Migra imágenes efímeras (Google "aida-public") a Supabase Storage.
 *
 * Esas URLs (lh3.googleusercontent.com/aida-public/...) son placeholders
 * generados por una herramienta de diseño y caducan -> acabarían dando 404.
 * Este script las descarga, las sube a un bucket público y reescribe la BD.
 *
 * Uso:  node habitus-app/scripts/migrate-images-to-storage.mjs
 * Lee credenciales de habitus-app/.env.local (VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- cargar .env.local sin dependencias externas ---
function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv(join(__dirname, "..", ".env.local"));
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const BUCKET = "public-media";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Tablas/columnas a migrar (solo URLs aida-public).
const TARGETS = [
  { table: "habitus_listings", col: "cover_image_url", folder: "listings" },
  { table: "showcase_members", col: "avatar_url", folder: "members" },
];

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`✓ bucket "${BUCKET}" ya existe`);
    return;
  }
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "10MB",
  });
  if (error) throw error;
  console.log(`✓ bucket "${BUCKET}" creado (público)`);
}

async function migrateRow({ table, col, folder }, row) {
  const src = row[col];
  const res = await fetch(src);
  if (!res.ok) {
    console.warn(`  ✗ ${table}#${row.id}: fetch ${res.status} — se salta`);
    return false;
  }
  const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  const ext = EXT_BY_MIME[mime] || "jpg";
  const bytes = Buffer.from(await res.arrayBuffer());
  const path = `${folder}/${row.id}-${randomUUID().slice(0, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: true });
  if (upErr) {
    console.warn(`  ✗ ${table}#${row.id}: upload — ${upErr.message}`);
    return false;
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error: dbErr } = await supabase
    .from(table)
    .update({ [col]: pub.publicUrl })
    .eq("id", row.id);
  if (dbErr) {
    console.warn(`  ✗ ${table}#${row.id}: update DB — ${dbErr.message}`);
    return false;
  }
  console.log(`  ✓ ${table}#${row.id} -> ${path} (${(bytes.length / 1024).toFixed(0)} KB)`);
  return true;
}

async function main() {
  await ensureBucket();
  let ok = 0;
  let fail = 0;
  for (const target of TARGETS) {
    const { data: rows, error } = await supabase
      .from(target.table)
      .select(`id, ${target.col}`)
      .ilike(target.col, "%aida-public%");
    if (error) {
      console.error(`Error leyendo ${target.table}: ${error.message}`);
      continue;
    }
    console.log(`\n${target.table}.${target.col}: ${rows.length} a migrar`);
    for (const row of rows) {
      const done = await migrateRow(target, row);
      done ? ok++ : fail++;
    }
  }
  console.log(`\nHecho. Migradas: ${ok} | Fallidas: ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
