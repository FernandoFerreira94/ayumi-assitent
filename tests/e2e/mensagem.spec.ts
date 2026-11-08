import { expect, test } from "./fixtures";

// No teste não há WhatsApp conectado: nenhuma mensagem sai de verdade, e a tela mostra o aviso de reconectar
test("tocar na cliente abre a conversa; sem WhatsApp, a mensagem fica como não enviada", async ({ page }) => {
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Maria Silva");
  await page.getByLabel("WhatsApp").fill("11987654321");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  await page.getByRole("button", { name: /Maria Silva/ }).click();
  const conversa = page.getByRole("dialog", { name: "Maria Silva" });
  await expect(conversa.getByText("(11) 98765-4321 · pelo WhatsApp do salão")).toBeVisible();
  const enviar = conversa.getByRole("button", { name: "Enviar" });
  await expect(enviar).toBeDisabled();

  await conversa.getByLabel("Mensagem para Maria Silva").fill("Oi, Maria! Tudo certo para amanhã?");
  await enviar.click();
  await expect(conversa.getByText("Oi, Maria! Tudo certo para amanhã?")).toBeVisible();
  // Desconectado (CI) ou fora do ar: nos dois casos fica marcada e diz o que fazer
  await expect(conversa.getByRole("alert")).toContainText("Não enviada.");
  await expect(
    conversa
      .getByRole("alert")
      .getByRole("link", { name: "Reconectar" })
      .or(conversa.getByRole("button", { name: "Tentar de novo" })),
  ).toBeVisible();
  await expect(conversa.getByLabel("Mensagem para Maria Silva")).toHaveValue("");
});

test("nas ações do agendamento também dá para mandar mensagem", async ({ page }) => {
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Alongamento");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("150,00");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Joana Lima");
  await page.getByLabel("WhatsApp").fill("11912345678");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  await page.goto("/calendario");
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Joana Lima/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Alongamento/ }).click();
  await page.getByLabel("Horário").selectOption("10:00");
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("button", { name: /Joana Lima/ }).click();
  await page.getByRole("button", { name: "Mensagem no WhatsApp" }).click();
  await expect(page.getByRole("dialog", { name: "Joana Lima" }).getByLabel("Mensagem para Joana Lima")).toBeVisible();
});
