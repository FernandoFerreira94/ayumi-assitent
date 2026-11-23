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
  for (const [nome, tel] of [
    ["Bia Souza", "11987651111"],
    ["Carla Lima", "11987652222"],
    ["Dani Rocha", "11987653333"],
  ]) {
    await page.goto("/clientes");
    await page.getByRole("button", { name: "Nova cliente" }).click();
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel("WhatsApp").fill(tel);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Cliente cadastrada")).toBeVisible();
  }
}

async function agenda(page: Page, cliente: RegExp, dia: string, hora: string, sinal: "pedir" | "recebido" | null) {
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await preencheAgendar(page, { cliente, servicos: [/Escova/], hora });
  if (sinal) {
    await page.getByRole("button", { name: /^Sinal/ }).click();
    const s = page.getByRole("dialog", { name: "Sinal" });
    await s.getByLabel("Valor do sinal").fill("30,00");
    if (sinal === "recebido") {
      await s.getByRole("button", { name: "Já recebi" }).click();
      await s.getByRole("button", { name: "Pix" }).click();
    }
    await s.getByRole("button", { name: "Pronto" }).click();
  }
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
}

test("lista quem pagou o sinal, quem só tem pedido e quem está sem sinal; marca o sinal recebido", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await prepara(page);
  const amanha = addDays(todayStr(), 1);
  await agenda(page, /Bia Souza/, amanha, "10:00", "recebido");
  await agenda(page, /Carla Lima/, amanha, "11:00", "pedir");
  await agenda(page, /Dani Rocha/, amanha, "14:00", null);

  await page.goto("/agendamentos");
  await expect(page.getByRole("heading", { name: "Agendamentos" })).toBeVisible();
  const filtro = page.getByRole("group", { name: "Filtrar pelo sinal" });
  await expect(filtro.getByRole("button", { name: /Sinal pago\s*1\s*R\$\s30,00/ })).toBeVisible();
  await expect(filtro.getByRole("button", { name: /Sinal pedido\s*1\s*R\$\s30,00/ })).toBeVisible();
  await expect(filtro.getByRole("button", { name: /Sem sinal\s*1\s*R\$\s80,00/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Amanhã/ })).toBeVisible();

  // Filtro "Sinal pedido": só a Carla, e a URL acompanha sem recarregar
  await filtro.getByRole("button", { name: /Sinal pedido/ }).click();
  await expect(page).toHaveURL(/sinal=requested/);
  await expect(page.getByRole("button", { name: /Carla Lima/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bia Souza/ })).toHaveCount(0);

  // Busca sem acento
  await filtro.getByRole("button", { name: /Sinal pedido/ }).click();
  await page.getByRole("searchbox", { name: "Buscar cliente" }).fill("dani");
  await expect(page.getByRole("button", { name: /Dani Rocha/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Carla Lima/ })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Buscar cliente" }).fill("");

  // Tocar na linha abre o atendimento; "Sinal recebido" move a Carla para Sinal pago
  await page.getByRole("button", { name: /Carla Lima/ }).click();
  const detalhe = page.getByRole("dialog", { name: "Carla Lima" });
  await detalhe.getByRole("button", { name: /Sinal pedido R\$\s30,00.*Sinal recebido/ }).click();
  const folha = page.getByRole("dialog", { name: /Pagamento de Carla/ });
  await folha.getByRole("button", { name: "Pix" }).click();
  await folha.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Sinal marcado")).toBeVisible();
  // O atendimento já mostra o sinal pago; fechar a folha volta para a lista atualizada
  await expect(detalhe.getByRole("button", { name: /Sinal R\$\s30,00 · falta R\$\s50,00/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detalhe).toBeHidden();
  await expect(filtro.getByRole("button", { name: /Sinal pago\s*2\s*R\$\s60,00/ })).toBeVisible();
  await expect(filtro.getByRole("button", { name: /Sinal pedido\s*0/ })).toBeVisible();
});

test("sem agendamentos mostra a tela vazia", async ({ page }) => {
  await page.goto("/agendamentos");
  await expect(page.getByRole("heading", { name: "Nenhum agendamento pela frente" })).toBeVisible();
});
