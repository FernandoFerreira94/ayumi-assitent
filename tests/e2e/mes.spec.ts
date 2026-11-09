import { expect, test } from "./fixtures";

test("Painel: o nome do mês abre o seletor e pula para outro mês", async ({ page }) => {
  const next = new Date().getFullYear() + 1;
  await page.goto("/agenda");
  await page.getByRole("button", { name: /trocar mês/ }).click();
  await expect(page.getByRole("heading", { name: "Escolher mês" })).toBeVisible();
  await page.getByRole("button", { name: "Próximo ano" }).click();
  await page.getByRole("link", { name: `março de ${next}` }).click();
  await expect(page).toHaveURL(new RegExp(`/agenda\\?d=${next}-03-01`));
  await expect(page.getByRole("button", { name: new RegExp(`Março de ${next}`) })).toBeVisible();
  // exact: o dia de hoje na faixa também tem "(hoje)" no nome
  await page.getByRole("link", { name: "Hoje", exact: true }).click();
  await expect(page).toHaveURL(/\/agenda$/);
});

test("Calendário: do dia para o mês, do mês para o ano e de volta", async ({ page }) => {
  const year = String(new Date().getFullYear());
  await page.goto("/calendario");
  await page.getByRole("link", { name: /Voltar para o mês/ }).click();
  await expect(page).toHaveURL(/v=mes/);
  await page.getByRole("link", { name: year, exact: true }).click();
  await expect(page).toHaveURL(/v=ano/);
  await page.getByRole("link", { name: new RegExp(`^março de ${year}$`, "i") }).click();
  await expect(page).toHaveURL(new RegExp(`v=mes&m=${year}-03`));
  await page
    .getByRole("link", { name: new RegExp(`^1 de março|, 1 de março`) })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`d=${year}-03-01`));
});
