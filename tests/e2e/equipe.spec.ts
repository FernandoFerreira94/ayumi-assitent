import { expect, test } from "./fixtures";

test("dona adiciona profissional, gera o convite e desativa", async ({ page }) => {
  await page.goto("/ajustes");
  await page.getByRole("link", { name: /Equipe/ }).click();
  await expect(page.getByRole("heading", { name: "Equipe" })).toBeVisible();

  await page.getByRole("button", { name: "Adicionar profissional" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox", { name: "Nome" }).fill("Bia Souza");
  await sheet.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText("Profissional adicionada")).toBeVisible();

  const row = page.getByRole("button", { name: /Bia Souza/ });
  await expect(row).toContainText("Sem acesso ao app");
  await row.click();
  await sheet.getByRole("button", { name: "Convidar para o app" }).click();
  await expect(sheet.getByText(/\/convite\//)).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Mandar pelo WhatsApp" })).toBeVisible();

  await sheet.getByRole("button", { name: "Desativar profissional" }).click();
  await expect(page.getByText("Bia Souza desativada")).toBeVisible();
});

test("convite que não existe mostra o erro sem vazar nada", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/convite/${"a".repeat(43)}`);
  await expect(page.getByRole("alert")).toContainText("convite não é válido");
  await expect(page.getByRole("button", { name: "Entrar com Google" })).toHaveCount(0);
  await ctx.close();
});
