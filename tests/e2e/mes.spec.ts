import { expect, test } from "./fixtures";

test("o nome do mês abre o seletor e pula para outro mês", async ({ page }) => {
  const next = new Date().getFullYear() + 1;
  await page.goto("/agenda");
  await page.getByRole("button", { name: /trocar mês/ }).click();
  await expect(page.getByRole("heading", { name: "Escolher mês" })).toBeVisible();
  await page.getByRole("button", { name: "Próximo ano" }).click();
  await page.getByRole("link", { name: `março de ${next}` }).click();
  await expect(page).toHaveURL(new RegExp(`/agenda\\?d=${next}-03-01`));
  await expect(page.getByRole("button", { name: new RegExp(`Março de ${next}`) })).toBeVisible();
  await page.getByRole("link", { name: "Hoje" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
});
