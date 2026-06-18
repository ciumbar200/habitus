import { expect, test, type Page, type ConsoleMessage } from "@playwright/test";

const PASSWORD = "HabitusDemo2026!";
const OWNER_EMAIL = "demo-propietario@e2e.habitus.local";
const TENANT_EMAIL = "demo-inquilino@e2e.habitus.local";

function trackErrors(page: Page) {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() >= 500 || (res.status() >= 400 && /supabase\.co\/(rest|rpc|functions|auth)/.test(url))) {
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

test.describe("Contratos/finanzas UI — rutas profundas autenticadas", () => {
  test("propietario puede abrir contratos e ingresos por URL directa sin rebote", async ({ page }) => {
    const { consoleErrors, networkErrors } = trackErrors(page);
    await login(page, OWNER_EMAIL);

    await page.goto("/panel/propietarios");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/panel\/propietarios$/);
    await expect(page.getByRole("heading", { name: /Panel de propietarios/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Publicar piso/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ingresos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Contratos/i })).toBeVisible();

    await page.goto("/panel/contratos");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/panel\/contratos$/);
    await expect(page.getByRole("heading", { name: /Hub de contratos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nuevo contrato habitación/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nuevo contrato piso/i })).toBeVisible();

    await page.goto("/panel/propietarios/contratos");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/panel\/propietarios\/contratos$/);
    await expect(page.getByRole("heading", { name: /Mis Contratos de Piso/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Nuevo Contrato/i })).toBeVisible();

    await page.getByRole("button", { name: /\+ Nuevo Contrato/i }).click();
    await expect(page).toHaveURL(/\/panel\/propietarios\/contratos\/nuevo$/);
    await expect(page.getByRole("heading", { name: /Nuevo contrato de piso/i })).toBeVisible();
    await expect(page.getByLabel(/Piso/i)).toBeVisible();

    await page.goto("/panel/propietarios/ingresos");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/panel\/propietarios\/ingresos$/);
    await expect(page.getByRole("heading", { name: /Mis Ingresos/i })).toBeVisible();
    await expect(page.getByText(/Ingresos mensuales/i)).toBeVisible();

    expect(networkErrors, `Errores Supabase:\n${networkErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Errores consola:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("inquilino puede abrir grupos por URL directa", async ({ page }) => {
    const { consoleErrors, networkErrors } = trackErrors(page);
    await login(page, TENANT_EMAIL);

    await page.goto("/panel/grupos");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/panel\/grupos$/);
    await expect(page.getByRole("heading", { name: /Reparte los gastos de tu piso/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Crear grupo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Invitar miembros/i })).toBeVisible();

    await page.goto("/grupos");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page).toHaveURL(/\/grupos$/);
    await expect(page.locator("body")).toContainText(/grupo|Crear/i);

    expect(networkErrors, `Errores Supabase:\n${networkErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `Errores consola:\n${consoleErrors.join("\n")}`).toEqual([]);
  });
});
