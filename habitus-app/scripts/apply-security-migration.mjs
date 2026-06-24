#!/usr/bin/env node
/**
 * Aplica la migración de seguridad vía Supabase CLI (requiere proyecto linked + login).
 * Alternativa: npm run db:apply-security
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migration = resolve(root, "supabase/migrations/20260621120000_harden_admin_rpc_security.sql");

console.log("Aplicando migración de seguridad en Supabase linked…");
execSync(`supabase db query -f "${migration}" --linked --yes`, {
  cwd: root,
  stdio: "inherit",
});
console.log("✓ Listo.");
