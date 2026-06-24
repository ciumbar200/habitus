#!/usr/bin/env node
/**
 * Audita migraciones SQL en busca de patrones de seguridad problemáticos.
 * Uso: node scripts/audit-sql-security.mjs
 * Exit 1 si encuentra hallazgos críticos.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), "../supabase/migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

const findings = [];

const ADMIN_RPC_NAMES = [
  "habitus_admin_get_users_with_email",
  "admin_get_rooms_with_assignments",
];

for (const file of files) {
  const path = resolve(migrationsDir, file);
  const sql = readFileSync(path, "utf8");
  const lines = sql.split("\n");

  // Solo auditar archivos anteriores al hardening (el fix está en 20260621120000)
  const isHardened = file >= "20260621120000_harden_admin_rpc_security.sql";
  if (isHardened) continue;

  // SECURITY DEFINER sin habitus_is_admin en la misma función
  const funcBlocks = sql.split(/CREATE OR REPLACE FUNCTION/i).slice(1);
  for (const block of funcBlocks) {
    if (!/SECURITY\s+DEFINER/i.test(block)) continue;
    const nameMatch = block.match(/public\.(\w+)/);
    const name = nameMatch?.[1] ?? "unknown";
    const isAdminRpc = ADMIN_RPC_NAMES.some((n) => block.includes(n)) || name.startsWith("admin_");
    if (isAdminRpc && !/habitus_is_admin\s*\(\)/i.test(block)) {
      findings.push({
        severity: "critical",
        file,
        message: `Función SECURITY DEFINER "${name}" sin check habitus_is_admin()`,
      });
    }
  }

  // Referencia a public.profiles (tabla incorrecta)
  if (/public\.profiles\b/.test(sql) && !file.includes("harden_admin")) {
    findings.push({
      severity: "high",
      file,
      message: "Referencia a public.profiles (debería ser habitus_profiles)",
    });
  }

  // Políticas SELECT demasiado abiertas en group_invites (solo CREATE, no DROP)
  if (/CREATE POLICY\s+"group_invites_select_anyone"/.test(sql)) {
    findings.push({
      severity: "high",
      file,
      message: "Política group_invites_select_anyone permite lectura masiva",
    });
  }

  // GRANT EXECUTE a authenticated en RPCs admin sin hardening en el mismo archivo
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /GRANT EXECUTE.*TO authenticated/i.test(line) &&
      ADMIN_RPC_NAMES.some((n) => lines.slice(Math.max(0, i - 30), i + 5).join("\n").includes(n)) &&
      !sql.includes("harden_admin_rpc_security")
    ) {
      const context = lines.slice(Math.max(0, i - 5), i + 1).join(" ");
      if (ADMIN_RPC_NAMES.some((n) => context.includes(n))) {
        findings.push({
          severity: "medium",
          file,
          message: `GRANT EXECUTE a authenticated cerca de RPC admin (línea ~${i + 1})`,
        });
      }
    }
  }
}

const critical = findings.filter((f) => f.severity === "critical");
const high = findings.filter((f) => f.severity === "high");
const medium = findings.filter((f) => f.severity === "medium");

console.log(`\n🔍 Auditoría SQL: ${files.length} migraciones\n`);

if (findings.length === 0) {
  console.log("✓ Sin hallazgos conocidos.\n");
  process.exit(0);
}

for (const f of [...critical, ...high, ...medium]) {
  const icon = f.severity === "critical" ? "🔴" : f.severity === "high" ? "🟠" : "🟡";
  console.log(`${icon} [${f.severity}] ${f.file}`);
  console.log(`   ${f.message}\n`);
}

if (critical.length > 0 || high.length > 0) {
  console.log(`Total: ${critical.length} críticos, ${high.length} altos, ${medium.length} medios`);
  process.exit(1);
}

console.log(`Solo hallazgos medios (${medium.length}).`);
process.exit(0);
