import { expect, test } from "./fixtures";

test("pendências vazia mostra 'Tudo em dia' e a agenda não mostra selo", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page.getByRole("link", { name: /Pendências para resolver/ })).toHaveCount(0);
  await page.goto("/pendencias");
  await expect(page.getByText("Tudo em dia")).toBeVisible();
  await page.getByRole("link", { name: /Voltar para a agenda/ }).click();
  await expect(page).toHaveURL(/\/agenda/);
});
