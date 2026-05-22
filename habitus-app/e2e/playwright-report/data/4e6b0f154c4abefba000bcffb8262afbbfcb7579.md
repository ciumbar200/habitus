# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agents/role-agents.spec.ts >> agente inquilino: registro, login y onboarding
- Location: e2e/agents/role-agents.spec.ts:16:3

# Error details

```
Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  ["page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until \"load\"
============================================================"]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { runRoleAgent, type AgentReport } from "../helpers/roleAgent";
  3  | import * as fs from "node:fs";
  4  | import * as path from "node:path";
  5  | 
  6  | const ROLES = ["inquilino", "anfitrion", "propietario", "agencia"] as const;
  7  | const REPORT_DIR = path.join(process.cwd(), "e2e", "reports");
  8  | 
  9  | test.describe.configure({ mode: "serial" });
  10 | 
  11 | const reports: AgentReport[] =
  12 |   (globalThis as { __habitusAgentReports?: AgentReport[] }).__habitusAgentReports ??=
  13 |     [];
  14 | 
  15 | for (const role of ROLES) {
  16 |   test(`agente ${role}: registro, login y onboarding`, async ({ page }) => {
  17 |     test.setTimeout(180_000);
  18 |     await page.waitForTimeout(4000);
  19 | 
  20 |     const report = await runRoleAgent(page, role);
  21 |     reports.push(report);
  22 | 
> 23 |     expect(report.errors, report.errors.join(" | ")).toHaveLength(0);
     |                                                      ^ Error: page.waitForURL: Timeout 15000ms exceeded.
  24 |     expect(report.signupOk, `signup falló en ${report.finalPath}`).toBeTruthy();
  25 |     expect(report.loginOk).toBeTruthy();
  26 |     expect(report.onboardingOk).toBeTruthy();
  27 |   });
  28 | }
  29 | 
  30 | test.afterAll(() => {
  31 |   if (reports.length === 0) return;
  32 | 
  33 |   fs.mkdirSync(REPORT_DIR, { recursive: true });
  34 |   const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  35 |   const jsonPath = path.join(REPORT_DIR, `agent-report-${stamp}.json`);
  36 |   fs.writeFileSync(jsonPath, JSON.stringify(reports, null, 2));
  37 | 
  38 |   const md = buildMarkdownReport(reports);
  39 |   const mdPath = path.join(REPORT_DIR, `agent-report-${stamp}.md`);
  40 |   fs.writeFileSync(mdPath, md);
  41 |   fs.writeFileSync(path.join(REPORT_DIR, "latest.json"), JSON.stringify(reports, null, 2));
  42 |   fs.writeFileSync(path.join(REPORT_DIR, "latest.md"), md);
  43 | 
  44 |   console.log("\n--- INFORME AGENTES E2E ---\n");
  45 |   console.log(md);
  46 |   console.log(`\nGuardado: ${mdPath}\n`);
  47 | });
  48 | 
  49 | function buildMarkdownReport(items: AgentReport[]): string {
  50 |   const lines = [
  51 |     "# Informe agentes E2E — Habitus",
  52 |     "",
  53 |     `Fecha: ${new Date().toLocaleString("es-ES")}`,
  54 |     "",
  55 |     "| Rol | Email | Registro | Login | Onboarding | Duración |",
  56 |     "|-----|-------|----------|-------|------------|----------|",
  57 |   ];
  58 | 
  59 |   for (const r of items) {
  60 |     lines.push(
  61 |       `| ${r.role} | \`${r.email}\` | ${r.signupOk ? "OK" : "FALLO"} | ${r.loginOk ? "OK" : "FALLO"} | ${r.onboardingOk ? "OK" : "FALLO"} | ${(r.durationMs / 1000).toFixed(1)}s |`,
  62 |     );
  63 |     if (r.errors.length) {
  64 |       lines.push(`| | Errores: ${r.errors.join("; ")} | | | | |`);
  65 |     }
  66 |     if (r.uxNotes?.length) {
  67 |       for (const note of r.uxNotes) {
  68 |         lines.push(`| | Nota: ${note} | | | | |`);
  69 |       }
  70 |     }
  71 |   }
  72 | 
  73 |   const failed = items.filter((r) => r.errors.length || !r.loginOk || !r.signupOk);
  74 |   lines.push("");
  75 |   if (failed.length === 0) {
  76 |     lines.push("**Resultado: todos los agentes pasaron.**");
  77 |   } else {
  78 |     lines.push(`**Resultado: ${failed.length} agente(s) con incidencias.**`);
  79 |   }
  80 | 
  81 |   return lines.join("\n");
  82 | }
  83 | 
```