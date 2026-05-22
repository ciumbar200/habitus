#!/usr/bin/env node
/**
 * Confirma el correo de un usuario de prueba vía Admin API (requiere service role).
 * Uso: node scripts/e2e-confirm-user.mjs user@1secmail.com
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim();
  }
}

loadEnv();

const email = process.argv[2];
const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email) {
  console.error("Uso: node scripts/e2e-confirm-user.mjs <email>");
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const listRes = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
  headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
});
if (!listRes.ok) {
  console.error("List users:", await listRes.text());
  process.exit(1);
}
const { users } = await listRes.json();
const user = users?.[0];
if (!user?.id) {
  console.error("Usuario no encontrado:", email);
  process.exit(1);
}

const patchRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email_confirm: true }),
});
if (!patchRes.ok) {
  console.error("Confirm:", await patchRes.text());
  process.exit(1);
}

console.log("✓ Correo confirmado para", email);
