import { test, expect } from "@playwright/test";

test.describe("UI acceso y roles (sin auth)", () => {
  test("formulario de registro muestra 4 roles y mensaje de éxito", async ({ page }) => {
    await page.goto("/access");
    await page.getByTestId("toggle-auth-mode").click();

    for (const slug of ["inquilino", "anfitrion", "propietario", "agencia"] as const) {
      await expect(page.getByTestId(`role-option-${slug}`)).toBeVisible();
    }

    await page.getByTestId("input-name").fill("QA UI");
    await page.getByTestId("role-option-inquilino").click();
    await page.getByTestId("input-email").fill("qa-ui@example.com");
    await page.getByTestId("input-password").fill("TestHabitus2026!");

    const submit = page.getByTestId("access-submit");
    await expect(submit).toBeEnabled();
  });

  test("toggle mostrar contraseña cambia el icono", async ({ page }) => {
    await page.goto("/access");
    await page.getByTestId("input-password").fill("secret");
    const toggle = page.getByRole("button", { name: /contraseña/i });
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId("input-password")).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(page.getByTestId("input-password")).toHaveAttribute("type", "text");
  });
});
