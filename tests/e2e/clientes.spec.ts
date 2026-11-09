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
  // Agrupada por letra, como os Contatos do iPhone
  await expect(page.getByRole("heading", { name: "M", exact: true })).toBeVisible();

  await cadastrar("Outra Pessoa", "11987654321");
  await expect(page.getByRole("alert").filter({ hasText: "Este número já é de outra cliente" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Busca enquanto digita, sem Enter
  const busca = page.getByRole("searchbox", { name: "Buscar cliente" });
  await busca.fill("zzz");
  await expect(page.getByText("Ninguém encontrada")).toBeVisible();
  await busca.fill("mar");
  await expect(page.getByText("Maria Silva")).toBeVisible();
  await expect(page).toHaveURL(/\?q=mar$/);
});

test("tocar no nome abre o cartão da cliente com histórico e ações", async ({ page }) => {
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Bia Souza");
  await page.getByLabel("WhatsApp").fill("11912345678");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  const cartao = page.getByRole("dialog", { name: "Bia Souza" });
  // Antes da hidratação o toque não abre a folha: repete até abrir
  await expect(async () => {
    await page.getByRole("button", { name: /^Bia Souza/ }).click({ timeout: 1000 });
    await expect(cartao).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(cartao.getByText("Nenhum marcado")).toBeVisible();
  await expect(cartao.getByText("visitas")).toBeVisible();
  await expect(cartao.getByRole("button", { name: "Agendar" })).toBeVisible();
  await cartao.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("dialog", { name: "Editar cliente" })).toBeVisible();
});

test("o sino abre um diálogo no meio da tela e marca tudo como lido", async ({ page }) => {
  await page.goto("/agenda");
  await page.getByRole("button", { name: /^Notificações/ }).click();
  const dialog = page.getByRole("dialog", { name: "Notificações" });
  await expect(dialog).toBeVisible();
  // Conta nova sem WhatsApp nem Google: há avisos de integração para limpar
  await dialog.getByRole("button", { name: "Marcar todas como lidas" }).click();
  await expect(page.getByText("Tudo marcado como lido")).toBeVisible();
  await expect(dialog.getByText("Tudo em dia por aqui.")).toBeVisible();
});
