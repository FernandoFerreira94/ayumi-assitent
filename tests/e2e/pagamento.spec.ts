import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { preencheAgendar } from "./agendar";
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

async function agenda(page: Page, dia: string, hora: string, pago: boolean | "sinal" | "pedir") {
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await preencheAgendar(page, { cliente: /Bia Souza/, servicos: [/Escova/], hora });
  if (pago === "sinal" || pago === "pedir") {
    await page.getByRole("button", { name: /^Sinal/ }).click();
    const s = page.getByRole("dialog", { name: "Sinal" });
    // "Pedir à cliente" é o padrão, com a sugestão de Ajustes > Pagamentos: 30% de R$ 80 = R$ 24
    await expect(s.getByRole("button", { name: "Pedir à cliente" })).toHaveAttribute("aria-pressed", "true");
    await expect(s.getByLabel("Valor do sinal")).toHaveValue("24,00");
    await s.getByLabel("Valor do sinal").fill("30,00");
    await expect(s.getByText(/Falta R\$\s50,00 no dia/)).toBeVisible();
    if (pago === "sinal") {
      await s.getByRole("button", { name: "Já recebi" }).click();
      await s.getByRole("button", { name: "Pix" }).click();
    } else {
      // vai no WhatsApp com o Pix, sem forma de pagamento
      await expect(s.getByText(/a receber/)).toBeVisible();
      await expect(s.getByRole("group", { name: "Forma de pagamento" })).toHaveCount(0);
    }
    await s.getByRole("button", { name: "Pronto" }).click();
    await expect(
      page.getByRole("button", { name: pago === "sinal" ? /Sinal.*Recebido R\$\s30,00/ : /Sinal.*Pedir R\$\s30,00/ }),
    ).toBeVisible();
  } else if (pago) {
    await page.getByRole("button", { name: /Já pagou tudo/ }).click();
    const s = page.getByRole("dialog", { name: "Já pagou tudo?" });
    await s.getByRole("button", { name: "Pix" }).click();
    await s.getByRole("button", { name: "Marcar como pago" }).click();
  }
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
  await page
    .getByRole("tabpanel")
    .getByRole("button", { name: /Bia Souza/ })
    .click();
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

test("pedir sinal ao agendar: fica a receber até marcar Sinal recebido", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await agenda(page, dia, "15:00", "pedir");
  await page.getByRole("button", { name: /Bia Souza, Escova, 15:00/ }).click();
  const selo = page.getByRole("button", { name: /Sinal pedido R\$\s30,00.*Sinal recebido/ });
  await expect(selo).toBeVisible();
  await selo.click();
  const folha = page.getByRole("dialog", { name: /Pagamento de Bia/ });
  // abre no sinal com o valor pedido
  await expect(folha.getByLabel("Valor do sinal")).toHaveValue("30,00");
  await folha.getByRole("button", { name: "Pix" }).click();
  await folha.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Sinal marcado")).toBeVisible();
  await expect(page.getByRole("button", { name: /Sinal R\$\s30,00 · falta R\$\s50,00/ })).toBeVisible();
});

test("cancelar o que já foi pago vira crédito, que dá para devolver na ficha", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 3);
  await agenda(page, dia, "10:00", true);
  await page.getByRole("button", { name: /Bia Souza, Escova, 10:00/ }).click();
  await page.getByRole("button", { name: "Mais ações" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  // Horário futuro: pergunta se avisa a cliente, ligado por padrão
  await expect(page.getByRole("switch", { name: "Avisar a cliente no WhatsApp" })).toBeChecked();
  await page.getByRole("button", { name: "Cancelar horário" }).click();
  // com 24 h ou mais de antecedência, tudo vira crédito (Ajustes > Pagamentos)
  await expect(page.getByText(/Agendamento cancelado\. R\$\s80,00 virou crédito da cliente/)).toBeVisible();

  await page.goto("/clientes");
  const cartao = page.getByRole("dialog", { name: "Bia Souza" });
  await expect(async () => {
    await page.getByRole("button", { name: /^Bia Souza/ }).click({ timeout: 1000 });
    await expect(cartao).toBeVisible({ timeout: 1000 });
  }).toPass();
  const carteira = cartao.getByRole("region", { name: "Crédito da cliente" });
  await expect(carteira).toContainText(/R\$\s80,00/);
  await expect(carteira).toContainText("Cancelou");
  await carteira.getByRole("button", { name: "Devolver" }).click();
  const folha = page.getByRole("dialog", { name: "Devolver para Bia" });
  await folha.getByLabel("Valor a devolver").fill("30,00");
  await folha.getByRole("button", { name: "Devolver", exact: true }).click();
  await expect(page.getByText("Devolvido para Bia")).toBeVisible();
  await expect(carteira).toContainText(/R\$\s50,00/);
});
