import { expect, test } from "./fixtures";
import { preencheAgendar } from "./agendar";
import { addDays, todayStr } from "../../src/lib/dates";

/** Prints do UX para o PR (só com PRINTS=pasta). */
const shot = async (page: import("@playwright/test").Page, name: string) => {
  if (process.env.PRINTS) await page.screenshot({ path: `${process.env.PRINTS}/${name}.png` });
};

test("criar Pague 3 leve 4, vender na ficha e agendar usando a sessão", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Esmaltação");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("45,00");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Bia Souza");
  await page.getByLabel("WhatsApp").fill("11987651111");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  // Ajustes > Pagamentos > aba Pacotes: passo a passo de 3 telas
  await page.goto("/ajustes/pagamentos");
  await page.getByRole("tab", { name: "Pacotes e promoções" }).click();
  await page.getByRole("button", { name: "Criar pacote" }).click();
  const novo = page.getByRole("dialog", { name: /Novo pacote|Pacote criado/ });
  await expect(novo.getByText("Passo 1 de 3 · Tipo")).toBeVisible();
  await novo.getByRole("button", { name: "Continuar" }).click();
  await expect(novo.getByText("Passo 2 de 3", { exact: false })).toBeVisible();
  await expect(novo.getByText("economiza R$ 45,00")).toBeVisible();
  await expect(novo).toContainText("R$ 135,00");
  await novo.getByRole("button", { name: "Continuar" }).click();
  await novo.getByRole("button", { name: "Criar pacote" }).click();
  await expect(page.getByText("Pacote criado", { exact: true })).toBeVisible();
  // Criou: já mostra o texto pronto para divulgar
  await expect(novo.getByLabel("Texto para divulgar")).toHaveValue(/Pague 3 e leve 4 sessões de Esmaltação/);
  await novo.getByRole("button", { name: "Pronto" }).click();
  const vitrine = page.getByRole("region", { name: "Pacotes à venda" });
  await expect(vitrine).toContainText("Pague 3 leve 4 Esmaltação");

  // Promoção: datas e vagas
  await page.getByRole("button", { name: "Criar pacote" }).click();
  await novo.getByRole("radio", { name: /Pacote de sessões/ }).click();
  await novo.getByRole("button", { name: "Continuar" }).click();
  // Desconto em % (padrão) com prévia "De… por…"; R$ e preço final também
  await novo.getByLabel("Desconto em porcentagem").fill("20");
  await expect(novo).toContainText("De R$ 180,00 por R$ 144,00");
  await expect(novo.getByText("−20% · economiza R$ 36,00")).toBeVisible();
  await shot(page, "1-desconto-porcentagem");
  await novo.getByRole("radio", { name: "Em R$" }).click();
  await novo.getByLabel("Desconto em reais").fill("30,00");
  await expect(novo).toContainText("De R$ 180,00 por R$ 150,00");
  await novo.getByRole("button", { name: "Continuar" }).click();
  await novo.getByLabel("Início da promoção").fill(todayStr());
  await novo.getByLabel("Fim da promoção").fill(addDays(todayStr(), 30));
  await novo.getByLabel("Limite de clientes").fill("30");
  await expect(novo.getByText("para as 30 primeiras clientes", { exact: false })).toBeVisible();
  await novo.getByRole("button", { name: "Natal", exact: true }).click();
  await expect(novo.getByLabel("Nome da promoção (opcional)")).toHaveValue("Natal");
  await shot(page, "2-nome-e-vagas");
  await novo.getByRole("button", { name: "Criar pacote" }).click();
  await expect(page.getByText("Pacote criado", { exact: true })).toBeVisible();
  await expect(novo.getByLabel("Texto para divulgar")).toHaveValue(/^✨ Natal · Estúdio E2E ✨/);
  await expect(novo.getByLabel("Texto para divulgar")).toHaveValue(/Só para as 30 primeiras clientes!/);
  await shot(page, "3-texto-status");
  await novo.getByRole("radio", { name: /Mensagem/ }).click();
  await expect(novo.getByLabel("Texto para divulgar")).toHaveValue(/^Oi! Tudo bem\?/);
  await novo.getByRole("button", { name: "Pronto" }).click();
  await expect(vitrine).toContainText("restam 30");
  await expect(vitrine).toContainText("−17%");
  await shot(page, "4-cartoes");
  await vitrine.getByRole("button", { name: "Divulgar Natal" }).click();
  await expect(page.getByRole("dialog", { name: "Divulgar Natal" }).getByLabel("Texto para divulgar")).toHaveValue(
    /De R\$ 180,00 por R\$ 150,00/,
  );
  await page.keyboard.press("Escape");

  // Ficha: vender
  await page.goto("/clientes");
  const cartao = page.getByRole("dialog", { name: "Bia Souza" });
  await expect(async () => {
    await page.getByRole("button", { name: /^Bia Souza/ }).click({ timeout: 1000 });
    await expect(cartao).toBeVisible({ timeout: 1000 });
  }).toPass();
  const pacotes = cartao.getByRole("region", { name: "Pacotes da cliente" });
  await pacotes.getByRole("button", { name: "Vender pacote" }).click();
  const venda = page.getByRole("dialog", { name: "Vender pacote para Bia" });
  await venda.getByRole("button", { name: "Vender", exact: true }).click();
  await expect(page.getByText(/Pacote vendido para Bia: 4 sessões/)).toBeVisible();
  await expect(pacotes).toContainText("4 de 4");
  await page.keyboard.press("Escape");

  // Agendar: usa a sessão sozinho
  const dia = addDays(todayStr(), 2);
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await preencheAgendar(page, { cliente: /Bia Souza/, servicos: [/Esmaltação/], hora: "10:00" });
  // Antes de salvar, a folha avisa que vai pelo pacote: qual sessão e quantas restam
  const plano = page.getByRole("group", { name: "Pacote da cliente" });
  await expect(plano).toContainText("Pelo pacote Pague 3 leve 4 Esmaltação");
  await expect(plano).toContainText("Sessão 1 de 4 · restam 3");
  await expect(plano).toContainText(/R\$\s33,75 já pago pelo pacote/);
  await expect(plano.getByRole("switch", { name: "Usar sessão do pacote" })).toBeChecked();
  await shot(page, "pacote-1-agendar");
  // A mensagem leva só uma linha sutil
  await page.getByRole("button", { name: /Ver o que Bia recebe no WhatsApp/ }).click();
  await expect(page.getByText("✨ Sessão 1 de 4 do seu pacote")).toBeVisible();
  await shot(page, "pacote-2-mensagem");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByText("Usou 1 sessão do pacote Pague 3 leve 4 Esmaltação. Restam 3 de 4")).toBeVisible();

  // No cartão do atendimento: pelo pacote, sessão 1 de 4
  await page.goto(`/agenda?d=${dia}`);
  await page.getByRole("button", { name: /Bia Souza, Esmaltação, 10:00/ }).click();
  await expect(page.getByText("Pelo pacote Pague 3 leve 4 Esmaltação")).toBeVisible();
  await expect(page.getByText("Sessão 1 de 4 · restam 3")).toBeVisible();
  await shot(page, "pacote-3-cartao");
  await page.keyboard.press("Escape");

  // Venda entra no caixa de hoje
  await page.goto(`/financeiro?m=${todayStr().slice(0, 7)}`);
  await expect(page.getByText("Entrou no caixa").locator("..")).toContainText(/R\$\s135,00/);

  // Regras à mão no Financeiro
  await page.getByRole("button", { name: "Como funciona" }).click();
  const guia = page.getByRole("dialog", { name: "Como funciona" });
  await expect(guia).toContainText("Cancelou com 24h ou mais");
  await expect(guia).toContainText("Crédito nunca vence");
});
