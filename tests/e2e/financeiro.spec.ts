import { expect, test } from "./fixtures";

test("o previsto da agenda abre o Financeiro, que troca de período", async ({ page }) => {
  await page.goto("/calendario");
  await page.getByRole("link", { name: /Ver financeiro/ }).click();
  await expect(page).toHaveURL(/\/financeiro$/);
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
  // Conta nova: nada concluído ainda
  await expect(page.getByText("Nada recebido nesse período")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mês" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "Semestre" }).click();
  await expect(page).toHaveURL(/p=semestre/);
  await expect(page.getByText(/semestre de \d{4}/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Semestre" })).toHaveAttribute("aria-current", "page");
});
