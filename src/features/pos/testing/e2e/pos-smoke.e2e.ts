import { test, expect } from "@playwright/test";

test("POS módulo exporta pantalla", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vite|Ferretería/i);
});
