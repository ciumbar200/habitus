// verify-moon-score.mjs
// Comprueba que la migration del Moon Score (20260616230000) aterrizó en Supabase
// y que el read path que usa <MoonScoreBadge /> funciona. Solo lectura.
// Uso: node scripts/verify-moon-score.mjs   (desde habitus-app/)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = loadEnv(new URL("../.env.local", import.meta.url).pathname);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("❌ Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY en habitus-app/.env.local");
  process.exit(1);
}

const sb = createClient(url, key);

// 1) ¿Las columnas moon_score existen y tienen datos (backfill)?
const { data, error } = await sb
  .from("habitus_profiles")
  .select("id, display_name, identity_status, verification_badge, moon_score, moon_score_endorsements")
  .limit(10);
if (error) {
  console.error("❌ Lectura de habitus_profiles falló:", error.message);
  console.error("   (¿migration aplicada? ¿RLS bloquea al anon?)");
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log("⚠️  RLS devolvió 0 filas al anon. La migration puede estar OK; verifícalo logueado (el badge lee como usuario).");
} else {
  console.log(`✅ Columnas moon_score presentes. ${data.length} perfiles (muestra):`);
  for (const p of data) {
    console.log(
      `   • ${p.display_name ?? p.id}  identidad=${p.identity_status ?? "—"}/${p.verification_badge ?? "—"}  →  moon_score=${p.moon_score}  (endorsements=${p.moon_score_endorsements})`,
    );
  }
}

// 2) ¿La tabla de endosos existe?
const { count, error: e2 } = await sb
  .from("habitus_roommate_endorsements")
  .select("*", { count: "exact", head: true });
if (e2) {
  console.error("❌ Tabla habitus_roommate_endorsements:", e2.message);
  process.exit(1);
}
console.log(`✅ Tabla habitus_roommate_endorsements existe. Filas actuales: ${count}`);
console.log("\nMoon Score desplegado correctamente. Para ver scores 'vivos' hace falta sembrar endosos (endors>0).");
