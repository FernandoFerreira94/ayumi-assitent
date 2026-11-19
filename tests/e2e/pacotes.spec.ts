import { expect, test } from "./fixtures";
import { addDays, todayStr } from "../../src/lib/dates";

test("criar Pague 3 leve 4, vender na ficha e agendar usando a sessão", async ({ page }) => {
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

  // Ajustes > Pagamentos: modelo com prévia
  await page.goto("/ajustes/pagamentos");
  await page.getByRole("button", { name: "Criar pacote" }).click();
  const novo = page.getByRole("dialog", { name: "Novo pacote" });
  await expect(
    novo.getByText("Paga 3 e leva 4: cliente paga R$ 135,00 e ganha 4 sessões de Esmaltação (economiza R$ 45,00)", {
      exact: false,
    }),
  ).toBeVisible();
  await novo.getByRole("button", { name: "Criar pacote" }).click();
  await expect(page.getByText("Pacote criado")).toBeVisible();
  await expect(page.getByRole("region", { name: "Pacotes à venda" })).toContainText("Pague 3 leve 4 Esmaltação");

  // Promoção: datas e limite de clientes
  await page.getByRole("button", { name: "Criar pacote" }).click();
  await novo.getByRole("button", { name: "Pacote de sessões" }).click();
  await novo.getByLabel("Preço do pacote").fill("150,00");
  await novo.getByLabel("Início da promoção").fill(todayStr());
  await novo.getByLabel("Fim da promoção").fill(addDays(todayStr(), 30));
  await novo.getByLabel("Limite de clientes").fill("30");
  await expect(novo.getByText("para as 30 primeiras clientes", { exact: false })).toBeVisible();
  await novo.getByLabel("Nome (opcional)").fill("Promo de dezembro");
  await novo.getByRole("button", { name: "Criar pacote" }).click();
  await expect(page.getByText("Pacote criado")).toBeVisible();
  await expect(page.getByRole("region", { name: "Pacotes à venda" })).toContainText("0 de 30 clientes");

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
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Bia Souza/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Esmaltação/ }).click();
  await page.getByLabel("Horário").selectOption("10:00");
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByText("Usou 1 sessão do pacote Pague 3 leve 4 Esmaltação. Restam 3 de 4")).toBeVisible();

  // Venda entra no caixa de hoje
  await page.goto(`/financeiro?m=${todayStr().slice(0, 7)}`);
  await expect(page.getByText("Entrou no caixa").locator("..")).toContainText(/R\$\s135,00/);

  // Regras à mão no Financeiro
  await page.getByRole("button", { name: "Como funciona" }).click();
  await expect(page.getByRole("dialog", { name: "Como funciona o dinheiro da cliente" })).toContainText(
    "Nunca vence e é usado sozinho",
  );
});
