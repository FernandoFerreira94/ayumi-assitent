import { expect, test } from "./fixtures";

test("cadastra, edita e remove serviço com desfazer; Ajustes leva para a tela", async ({ page }) => {
  await page.goto("/ajustes");
  await page.getByRole("link", { name: /Serviços/ }).click();
  await expect(page.getByRole("heading", { name: "Serviços" })).toBeVisible();
  await expect(page.getByText("Nenhum serviço cadastrado")).toBeVisible();

  await page.getByRole("button", { name: "Criar serviço" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("textbox", { name: "Nome", exact: true }).fill("Manicure");
  await sheet.getByRole("textbox", { name: /Preço/ }).fill("40,00");
  await sheet.getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
  const item = page.locator("main li").filter({ hasText: "Manicure" });
  await expect(item).toContainText("1h");
  await expect(item).toContainText("R$ 40,00");

  // Tocar na linha abre a edição com os valores atuais
  const row = page.getByRole("button", { name: /^Manicure/ });
  await row.click();
  await expect(page.getByRole("heading", { name: "Editar serviço" })).toBeVisible();
  await expect(sheet.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue("Manicure");
  await sheet.getByRole("button", { name: "Diminuir 15 minutos" }).click();
  await sheet.getByRole("textbox", { name: /Preço/ }).fill("55,00");
  await sheet.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Salvo", { exact: true })).toBeVisible();
  await expect(item).toContainText("45 min");
  await expect(item).toContainText("R$ 55,00");

  // Excluir pede um segundo toque
  await row.click();
  await sheet.getByRole("button", { name: "Excluir" }).click();
  await sheet.getByRole("button", { name: "Toque de novo para excluir" }).click();
  await expect(page.getByText("Manicure excluído")).toBeVisible();
  await expect(item).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(item).toContainText("45 min");
});
