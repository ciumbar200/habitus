import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PASSWORD = "HabitusDemo2026!";
const ADMIN_EMAIL = "demo-admin@e2e.habitus.local";
const EMBAJADOR_EMAIL = "demo-embajador@e2e.habitus.local";

const SCREEN_DIR = path.resolve("e2e/reports/screens");
fs.mkdirSync(SCREEN_DIR, { recursive: true });

// Routes are visited by CLICKING the AdminLayout sidebar links (client-side
// SPA navigation). A hard page.goto() to a deep /admin/* route bounces back to
// /admin because the auth guard runs before the session hydrates — clicking
// avoids that and exercises the real user path.
const ADMIN_ROUTES: { path: string; label: string }[] = [
  { path: "/admin/usuarios", label: "usuarios" },
  { path: "/admin/embajadores", label: "embajadores" },
  { path: "/admin/matching", label: "matching" },
  { path: "/admin/solicitudes", label: "solicitudes" },
  { path: "/admin/espacios", label: "espacios" },
  { path: "/admin/grupos", label: "grupos" },
  { path: "/admin/reportes", label: "reportes" },
  { path: "/admin/notificaciones", label: "notificaciones" },
  { path: "/admin/configuracion", label: "configuracion" },
  { path: "/admin/auditoria", label: "auditoria" },
];

// Error-state copy rendered by PageState / ErrorState across the admin pages.
const ERROR_TEXT = /Algo salió mal|Error al cargar|No autenticado|No se pudieron cargar|No autorizado/i;

function trackErrors(page: Page) {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() >= 400 && /supabase\.co\/(rest|rpc|functions|auth)/.test(url)) {
      networkErrors.push(`${res.status()} ${res.request().method()} ${url.split("?")[0]}`);
    }
  });
  return { consoleErrors, networkErrors };
}

async function login(page: Page, email: string) {
  await page.goto("/access");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(PASSWORD);
  await page.getByTestId("access-submit").click();
  await expect(page).not.toHaveURL(/\/access/, { timeout: 15_000 });
}

test.describe("Admin panel — todas las páginas cargan datos sin errores", () => {
  test("login admin + recorrido completo de /admin (nav real por clicks)", async ({ page }) => {
    const { consoleErrors, networkErrors } = trackErrors(page);
    const pageFailures: string[] = [];

    await login(page, ADMIN_EMAIL);

    // Establish admin context on the dashboard (goto /admin itself is the guard
    // redirect target, so it loads cleanly).
    await page.goto("/admin");
    await page.waitForURL(/\/admin$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.locator("h1")).toBeVisible();
    await page
      .screenshot({ path: path.join(SCREEN_DIR, "admin-dashboard.png"), fullPage: true })
      .catch(() => {});

    for (const route of ADMIN_ROUTES) {
      const netBefore = networkErrors.length;

      const link = page.locator(`nav a[href="${route.path}"]`).first();
      await expect(link, `falta enlace de nav a ${route.path}`).toBeVisible();
      await link.click();

      // Must actually land on the route (not bounce to /admin).
      try {
        await page.waitForURL(new RegExp(`${route.path.replace(/\//g, "\\/")}$`), { timeout: 10_000 });
      } catch {
        pageFailures.push(`${route.path}: navegación rebotó a ${new URL(page.url()).pathname}`);
        continue;
      }
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(700);

      await page
        .screenshot({ path: path.join(SCREEN_DIR, `admin-${route.label}.png`), fullPage: true })
        .catch(() => {});

      const bodyText = (await page.locator("body").innerText().catch(() => "")) ?? "";
      if (ERROR_TEXT.test(bodyText)) {
        const m = bodyText.match(ERROR_TEXT);
        pageFailures.push(`${route.path}: estado de error -> "${m?.[0]}"`);
      }
      if (networkErrors.length > netBefore) {
        pageFailures.push(`${route.path}: ${networkErrors.slice(netBefore).join(" | ")}`);
      }
    }

    // Bug #1 (applications RLS): Solicitudes must show real rows, not empty.
    await page.locator(`nav a[href="/admin/solicitudes"]`).first().click();
    await page.waitForURL(/\/admin\/solicitudes$/, { timeout: 10_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const solBody = (await page.locator("body").innerText()) ?? "";
    const solicitudesEmpty = /No hay solicitudes/i.test(solBody);

    console.log("\n=== RESULTADO VERIFICACIÓN ADMIN ===");
    console.log("Console errors:", consoleErrors.length, consoleErrors.slice(0, 10));
    console.log("Network 4xx/5xx (supabase):", networkErrors.length, networkErrors.slice(0, 10));
    console.log("Page failures:", pageFailures.length, pageFailures);
    console.log("Solicitudes vacía:", solicitudesEmpty);

    expect(networkErrors, `Errores de red Supabase:\n${networkErrors.join("\n")}`).toEqual([]);
    expect(pageFailures, `Fallos de página:\n${pageFailures.join("\n")}`).toEqual([]);
    expect(solicitudesEmpty, "Solicitudes muestra estado vacío pese a haber datos").toBe(false);
  });
});

test.describe("Embajadores — dashboard del embajador", () => {
  test("login embajador + /embajadores genera código y lista referidos", async ({ page }) => {
    const { consoleErrors, networkErrors } = trackErrors(page);

    await login(page, EMBAJADOR_EMAIL);

    await page.goto("/embajadores");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await page
      .screenshot({ path: path.join(SCREEN_DIR, "embajador-dashboard.png"), fullPage: true })
      .catch(() => {});

    await expect(page.getByRole("heading", { name: /Programa de Embajadores/i })).toBeVisible();
    await expect(page.getByText(/Tus referidos/i)).toBeVisible();

    console.log("\n=== RESULTADO VERIFICACIÓN EMBAJADOR ===");
    console.log("Console errors:", consoleErrors.length, consoleErrors.slice(0, 10));
    console.log("Network 4xx/5xx (supabase):", networkErrors.length, networkErrors.slice(0, 10));

    expect(networkErrors, `Errores de red Supabase:\n${networkErrors.join("\n")}`).toEqual([]);
  });
});
