import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const PASSWORD = "HabitusDemo2026!";
const ADMIN_EMAIL = "demo-admin@e2e.habitus.local";
const TENANT_EMAIL = "demo-inquilino@e2e.habitus.local";

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
  await expect(page).not.toHaveURL(/\/access$/, { timeout: 15_000 });
}

async function mockAdminVerifications(page: Page) {
  const payload = {
    checks: [
      {
        id: "check-demo-1",
        user_id: "user-demo-1",
        verification_type: "basic_trust",
        status: "basic_manual_review",
        public_badge: "none",
        liveness_code: "MOON-4821",
        rejection_reason: null,
        created_at: new Date().toISOString(),
        ai_result: {
          confidence_score: 88,
          recommended_status: "basic_manual_review",
        },
        risk_flags: ["document_blur"],
        profile: {
          display_name: "QA Verificación",
          account_role: "inquilino",
        },
        documents: [
          "https://example.com/front.jpg",
          null,
          "https://example.com/selfie.jpg",
          "https://example.com/selfie-code.jpg",
        ],
      },
    ],
  };

  await page.route("**/api/admin/verifications**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
      return;
    }
    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "basic_approved", publicBadge: "basic_trust" }),
      });
      return;
    }
    await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ error: "Method not allowed." }) });
  });
}

test.describe("Verificación y AI — smoke base", () => {
  test("usuario autenticado puede abrir /verificacion", async ({ page }) => {
    const { consoleErrors, networkErrors } = trackErrors(page);

    await login(page, TENANT_EMAIL);
    await page.goto("/verificacion");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page).toHaveURL(/\/verificacion$/);
    await expect(page.getByRole("heading", { name: /Verifica tu perfil/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /MoOn Basic Trust/i })).toBeVisible();

    expect(networkErrors, `Errores Supabase:\n${networkErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Errores consola:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("admin puede abrir /admin/verificaciones y /admin/ia", async ({ page }) => {
    const { consoleErrors, networkErrors } = trackErrors(page);

    await mockAdminVerifications(page);
    await login(page, ADMIN_EMAIL);

    await page.goto("/admin/verificaciones");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/admin\/verificaciones$/);
    await expect(page.getByRole("heading", { name: /^Verificaciones$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /QA Verificación/i })).toBeVisible();
    await page.getByRole("button", { name: /QA Verificación/i }).click();
    await expect(page.getByRole("heading", { name: /QA Verificación/i })).toBeVisible();
    await expect(page.getByText("document_blur")).toBeVisible();

    await page.goto("/admin/ia");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/admin\/ia$/);
    await expect(page.getByRole("heading", { name: /^Control IA$/i })).toBeVisible();
    await expect(page.getByText("Cola safety")).toBeVisible();
    await expect(page.getByText("Logs de uso")).toBeVisible();

    expect(networkErrors, `Errores Supabase:\n${networkErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Errores consola:\n${consoleErrors.join("\n")}`).toEqual([]);
  });
});
