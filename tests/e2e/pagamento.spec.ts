import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addDays, todayStr } from "../../src/lib/dates";

async function prepara(page: Page) {
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Escova");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("80,00");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Bia Souza");
  await page.getByLabel("WhatsApp").fill("11987651111");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();
}

async function agenda(page: Page, dia: string, hora: string, pago: boolean | "sinal") {
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Bia Souza/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Escova/ }).click();
  if (pago === "sinal") {
    await page.getByRole("button", { name: "Sinal", exact: true }).click();
    // sugestão de Ajustes > Pagamentos: 30% de R$ 80 = R$ 24
    await expect(page.getByLabel("Valor do sinal")).toHaveValue("24,00");
    await page.getByLabel("Valor do sinal").fill("30,00");
    await expect(page.getByText(/Falta R\$\s50,00 para pagar no dia/)).toBeVisible();
    await page.getByRole("button", { name: "Pix" }).click();
  } else if (pago) {
    await page.getByRole("button", { name: "Já pagou" }).click();
    await page.getByRole("button", { name: "Pix" }).click();
  }
  await page.getByLabel("Horário").selectOption(hora);
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
}

test("marca pago adiantado ao agendar e depois pelo Financeiro", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await agenda(page, dia, "10:00", true);
  await page.getByRole("button", { name: /Bia Souza, Escova, 10:00/ }).click();
  await expect(page.getByRole("button", { name: /Pago adiantado · Pix/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await agenda(page, dia, "14:00", false);
  await page.getByRole("button", { name: /Bia Souza, Escova, 14:00/ }).click();
  await expect(page.getByRole("button", { name: /A pagar.*Marcar pago/ })).toBeVisible();
  await page.keyboard.press("Escape");

  // Financeiro do mês do atendimento: um a pagar e um adiantado
  await page.goto(`/financeiro?m=${dia.slice(0, 7)}`);
  await expect(page.getByRole("tab", { name: /A pagar 1/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Adiantado 1/ })).toBeVisible();
  await page.getByRole("tabpanel").getByRole("button", { name: /Bia Souza/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Já pagou" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dinheiro" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Pagamento marcado")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Adiantado 2/ })).toBeVisible();
});

test("sinal ao agendar, receber o resto depois e ver o caixa do mês", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await agenda(page, dia, "11:00", "sinal");
  await page.getByRole("button", { name: /Bia Souza, Escova, 11:00/ }).click();
  const selo = page.getByRole("button", { name: /Sinal R\$\s30,00 · falta R\$\s50,00.*Receber o resto/ });
  await expect(selo).toBeVisible();
  await selo.click();
  const folha = page.getByRole("dialog", { name: /Pagamento de Bia/ });
  await expect(folha.getByText("Sinal pago")).toBeVisible();
  // abre em "Já pagou": receber o resto em dinheiro
  await folha.getByRole("button", { name: "Dinheiro" }).click();
  await folha.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Pagamento marcado")).toBeVisible();

  await page.goto(`/financeiro?m=${todayStr().slice(0, 7)}`);
  // Entrou hoje: R$ 30 do sinal + R$ 50 do resto
  await expect(page.getByText("Entrou no caixa").locator("..")).toContainText(/R\$\s80,00/);
});
