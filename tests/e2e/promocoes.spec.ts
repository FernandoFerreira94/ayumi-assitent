import { expect, test } from "./fixtures";
import { preencheAgendar } from "./agendar";
import { addDays, todayStr } from "../../src/lib/dates";

const shot = async (page: import("@playwright/test").Page, name: string) => {
  if (process.env.PRINTS) await page.screenshot({ path: `${process.env.PRINTS}/${name}.png` });
};

test("promoção de desconto: as 2 primeiras ganham 20%, aplica ao agendar, pausar e encerrar", async ({ page }) => {
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Esmaltação");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("45,00");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Carla Dias");
  await page.getByLabel("WhatsApp").fill("11987652222");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  // Link antigo de Ajustes leva para a página Planos
  await page.goto("/ajustes/pagamentos?aba=pacotes");
  await expect(page).toHaveURL(/\/planos\?aba=pacotes/);
  await page.getByRole("tab", { name: "Promoções" }).click();
  const painel = page.getByRole("region", { name: "Promoções de desconto" });
  await expect(painel).toContainText("Nenhuma promoção valendo");
  await painel.getByRole("button", { name: "Criar promoção de desconto" }).click();
  const nova = page.getByRole("dialog", { name: /Nova promoção|Promoção criada/ });
  await nova.getByLabel("Desconto em porcentagem").fill("20");
  await expect(nova.getByRole("list", { name: "Prévia dos preços" })).toContainText(/por\s*R\$\s36,00/);
  await shot(page, "5-promo-desconto");
  await nova.getByRole("button", { name: "Continuar" }).click();
  await nova.getByLabel("Quantas clientes ganham").fill("2");
  await nova.getByRole("button", { name: "Natal", exact: true }).click();
  await expect(nova).toContainText("As 2 primeiras clientes que agendarem ganham 20% de desconto em Esmaltação");
  await shot(page, "6-promo-quem-ganha");
  await nova.getByRole("button", { name: "Criar promoção" }).click();
  await expect(page.getByText("Promoção criada", { exact: true })).toBeVisible();
  await expect(nova.getByLabel("Texto para divulgar")).toHaveValue(/✨ Natal · Estúdio E2E ✨/);
  await expect(nova.getByLabel("Texto para divulgar")).toHaveValue(/De R\$ 45,00 por R\$ 36,00/);
  await expect(nova.getByLabel("Texto para divulgar")).toHaveValue(/Só para as 2 primeiras clientes!/);
  await shot(page, "7-promo-texto");
  await nova.getByRole("button", { name: "Pronto" }).click();
  await expect(painel).toContainText("Valendo");
  await expect(painel).toContainText("restam 2");

  // Agendar: a folha mostra a promoção e aplica
  const dia = addDays(todayStr(), 2);
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await preencheAgendar(page, { cliente: /Carla Dias/, servicos: [/Esmaltação/], hora: "10:00" });
  const promo = page.getByRole("group", { name: "Promoção" });
  await expect(promo).toContainText("Natal: −20%");
  await expect(promo).toContainText("restam 2 de 2");
  await expect(page.getByText("R$ 36,00").first()).toBeVisible();
  await shot(page, "8-agendar-com-promo");
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByText("Promoção Natal aplicada: −R$ 9,00")).toBeVisible();

  // Controle: quantas usaram, pausar, retomar, encerrar
  await page.goto("/planos?aba=promocoes");
  await expect(painel).toContainText("restam 1");
  await shot(page, "9-promo-cartao");
  await painel.getByRole("button", { name: "Pausar Natal" }).click();
  await expect(painel).toContainText("Pausada");
  await painel.getByRole("button", { name: "Retomar Natal" }).click();
  await expect(painel).toContainText("Valendo");
  await painel.getByRole("button", { name: "Encerrar Natal" }).click();
  await painel.getByRole("button", { name: "Sim, encerrar" }).click();
  await expect(page.getByText("Promoção encerrada")).toBeVisible();
  await expect(painel).toContainText("Encerradas (1)");
});
