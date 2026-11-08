import { expect, test } from "./fixtures";

test("cadastra, edita e remove serviço com desfazer; Ajustes leva para a tela", async ({ page }) => {
  await page.goto("/ajustes");
  await page.getByRole("link", { name: /Serviços/ }).click();
  await expect(page.getByRole("heading", { name: "Serviços" })).toBeVisible();
  await expect(page.getByText("Nenhum serviço cadastrado")).toBeVisible();

  await page.getByRole("button", { name: "Novo serviço" }).click();
  await page.getByLabel("Nome").fill("Manicure");
  await page.getByLabel("Valor (R$)").fill("40,00");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.getByText("Serviço adicionado")).toBeVisible();
  const row = page.getByRole("button", { name: /Manicure/ });
  await expect(row).toContainText("60 min · R$ 40,00");

  // Tocar na linha abre a edição com os valores atuais
  await row.click();
  await expect(page.getByRole("heading", { name: "Editar serviço" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveValue("Manicure");
  await page.getByLabel("Duração (min)").fill("45");
  await page.getByLabel("Valor (R$)").fill("55,00");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.getByText("Serviço atualizado")).toBeVisible();
  await expect(row).toContainText("45 min · R$ 55,00");

  await row.click();
  await page.getByRole("button", { name: "Remover serviço" }).click();
  await expect(page.getByText("Serviço removido")).toBeVisible();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(row).toContainText("45 min · R$ 55,00");
});
