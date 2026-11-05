import { expect, test } from "./fixtures";

test("cadastra cliente, avisa duplicado e busca", async ({ page }) => {
  await page.goto("/clientes");
  await expect(page.getByText("Nenhuma cliente ainda")).toBeVisible();

  const cadastrar = async (nome: string, tel: string) => {
    await page.getByRole("button", { name: "Nova cliente" }).click();
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel("WhatsApp").fill(tel);
    await page.getByRole("button", { name: "Salvar" }).click();
  };

  await cadastrar("Maria Silva", "11987654321");
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();
  await expect(page.getByText("Maria Silva")).toBeVisible();
  await expect(page.getByText("(11) 98765-4321")).toBeVisible();

  await cadastrar("Outra Pessoa", "11987654321");
  await expect(page.getByRole("alert").filter({ hasText: "Este número já é de outra cliente" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("searchbox", { name: "Buscar cliente" }).fill("zzz");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Ninguém encontrada")).toBeVisible();
});
