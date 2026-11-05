import { expect, test } from "./fixtures";

test("cria serviço, cliente e agendamento; avisa conflito; cancela com desfazer", async ({ page }) => {
  await page.goto("/ajustes");
  await page.getByLabel("Nome").fill("Alongamento");
  await page.getByLabel("Valor (R$)").fill("150,00");
  await page.getByRole("button", { name: "Adicionar serviço" }).click();
  await expect(page.getByText("Serviço adicionado")).toBeVisible();
  await expect(page.getByText("60 min · R$ 150,00")).toBeVisible();

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Maria Silva");
  await page.getByLabel("WhatsApp").fill("11987654321");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  await page.goto("/agenda");
  await expect(page.getByText("Dia livre")).toBeVisible();
  const agendar = async (hora: string) => {
    await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
    await page.getByLabel("Cliente").selectOption({ index: 1 });
    await page.getByLabel("Serviço").selectOption({ index: 1 });
    await page.getByLabel("Horário").selectOption(hora);
    await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  };

  await agendar("09:00");
  await expect(page.getByText("Agendamento criado")).toBeVisible();
  await expect(page.getByText("R$ 150,00").first()).toBeVisible();
  await expect(page.getByText("09:00 · Maria Silva")).toBeVisible();

  await agendar("09:30");
  await expect(page.getByRole("alert").filter({ hasText: "Esse horário acabou de ser ocupado" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByText("Agendamento cancelado")).toBeVisible();
  await expect(page.getByText("Dia livre")).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("09:00 · Maria Silva")).toBeVisible();
});
