import { expect, test } from "./fixtures";

test("cria serviço, cliente e agendamento; avisa conflito; cancela com desfazer", async ({ page }) => {
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Novo serviço" }).click();
  await page.getByLabel("Nome").fill("Alongamento");
  await page.getByLabel("Valor (R$)").fill("150,00");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.getByText("Serviço adicionado")).toBeVisible();
  await expect(page.getByText("60 min · R$ 150,00")).toBeVisible();

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Maria Silva");
  await page.getByLabel("WhatsApp").fill("11987654321");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  await page.goto("/agenda");
  const agendar = async (hora: string) => {
    await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
    // Seletores em lista por letra, como os contatos do iPhone
    await page.getByRole("button", { name: "Cliente" }).click();
    await expect(page.getByRole("region", { name: "M" })).toBeVisible();
    await page.getByRole("button", { name: /Maria Silva/ }).click();
    await page.getByRole("button", { name: "Serviço" }).click();
    await page.getByRole("button", { name: /Alongamento/ }).click();
    await page.getByLabel("Horário").selectOption(hora);
    await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  };

  await agendar("09:00");
  // Conta de teste sem WhatsApp conectado: salva, mas avisa que o lembrete não sai
  await expect(page.getByRole("heading", { name: "Agendado, sem lembrete" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByText("R$ 150,00").first()).toBeVisible();
  const bloco = page.getByRole("button", { name: /Maria Silva/ });
  await expect(bloco).toBeVisible();

  await agendar("09:30");
  await expect(page.getByRole("heading", { name: "Não deu para agendar" })).toBeVisible();
  await page.getByRole("button", { name: "Escolher outro horário" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Esse horário acabou de ser ocupado" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Na linha do dia, tocar no bloco abre as ações
  await bloco.click();
  // Cancelar pede um segundo toque
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Toque de novo para cancelar" }).click();
  await expect(page.getByText("Agendamento cancelado")).toBeVisible();
  await expect(bloco).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(bloco).toBeVisible();
});
