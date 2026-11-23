import { expect, test } from "./fixtures";
import { addDays, todayStr } from "../../src/lib/dates";

test("agendar na pausa do almoço avisa e pede confirmação, sem impedir", async ({ page }) => {
  // Todos os dias abertos com pausa 12:00–13:00, para não depender do dia da semana de hoje
  await page.goto("/ajustes/expediente");
  for (let i = 0; i < 7; i++) {
    await page.locator(`input[name="open-${i}"]`).check();
    await page.locator(`select[name="opens-${i}"]`).selectOption("06:00");
    await page.locator(`select[name="closes-${i}"]`).selectOption("22:00");
  }
  await page.getByLabel("Pausa", { exact: true }).check();
  await page.getByLabel("Pausa: começa").selectOption("12:00");
  await page.getByLabel("Pausa: termina").selectOption("13:00");
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByText("Expediente salvo")).toBeVisible();

  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Escova");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("80,00");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Ana Lima");
  await page.getByLabel("WhatsApp").fill("11987650000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  await page.goto(`/calendario?d=${addDays(todayStr(), 1)}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Ana Lima/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Escova/ }).click();

  const aviso = page.getByText("Esse horário pega sua pausa (12:00 às 13:00)", { exact: false }).first();
  await page.getByLabel("Horário").selectOption("14:00");
  await expect(aviso).toBeHidden();
  await page.getByLabel("Horário").selectOption("12:00");
  await expect(aviso).toBeVisible();

  // Agendar pede confirmação; "Escolher outro horário" volta para o campo de horário
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  const confirma = page.getByRole("alertdialog");
  await expect(confirma).toContainText("Vai pegar sua pausa");
  if (process.env.PAUSA_PRINT) await page.screenshot({ path: process.env.PAUSA_PRINT });
  await confirma.getByRole("button", { name: "Escolher outro horário" }).click();
  await expect(confirma).toBeHidden();
  await expect(page.getByLabel("Horário")).toBeFocused();

  // Confirmando, agenda normalmente
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Agendar mesmo assim" }).click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  // Remarcar avisa do mesmo jeito
  await page.getByRole("button", { name: /Ana Lima, Escova, 12:00/ }).click();
  await page.getByRole("button", { name: "Mais ações" }).click();
  await page.getByRole("button", { name: "Remarcar" }).click();
  const folha = page.getByRole("dialog", { name: /Editar Ana/ });
  await expect(folha.getByText(/pega sua pausa/)).toBeVisible();
  await folha.getByLabel("Horário").selectOption("15:00");
  await expect(folha.getByText(/pega sua pausa/)).toBeHidden();
  await folha.getByLabel("Horário").selectOption("12:30");
  await folha.getByRole("button", { name: "Salvar" }).click();
  await folha.getByRole("alertdialog").getByRole("button", { name: "Salvar mesmo assim" }).click();
  await expect(page.getByText("Agendamento atualizado")).toBeVisible();
});
