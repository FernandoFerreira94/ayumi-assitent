import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("Ajustes é uma lista: cada linha abre a sua seção e a seta volta para a lista", async ({ page }) => {
  await page.goto("/ajustes");
  for (const [row, title] of [
    ["Mensagens para a cliente", "Mensagens"],
    ["Expediente", "Expediente"],
    ["Ajuda e suporte", "Ajuda e suporte"],
  ] as const) {
    await page.getByRole("link", { name: new RegExp(`^${row}`) }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/ajustes$/);
  }
});

test("Conexões abrem em acordeão ali mesmo, um por vez, com selo de estado", async ({ page }) => {
  await page.goto("/ajustes");
  const conexoes = page.getByRole("region", { name: "Conexões" });
  await expect(conexoes.getByText(/de 3 ativas/)).toBeVisible();
  const whatsapp = page.locator("#ajuste-whatsapp");
  const calendarios = page.locator("#ajuste-calendarios");
  // Sem WhatsApp no teste: selo diz o estado sem abrir
  await expect(whatsapp.locator("[data-tone]")).toBeVisible();
  await expect(calendarios.locator("[data-tone]")).toHaveText("Não conectado");

  await whatsapp.click();
  await expect(whatsapp).toHaveAttribute("aria-expanded", "true");
  await expect(page).toHaveURL(/\/ajustes$/);
  await expect(page.locator("#conexao-whatsapp").getByText("WhatsApp", { exact: true })).toBeVisible();

  await calendarios.click();
  await expect(calendarios).toHaveAttribute("aria-expanded", "true");
  await expect(whatsapp).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#conexao-calendarios").getByRole("region", { name: "Google Agenda" })).toBeVisible();

  await calendarios.click();
  await expect(calendarios).toHaveAttribute("aria-expanded", "false");
});

test("Notificações em acordeão: liga a localização e o selo acompanha", async ({ page }) => {
  await page.goto("/ajustes");
  const notif = page.locator("#ajuste-notificacoes");
  await expect(notif.locator("[data-tone]")).toBeVisible();
  await notif.click();
  await expect(page.locator("#conexao-notificacoes").getByRole("region", { name: "Localização" })).toBeVisible();
});

test("seção aberta direto: a seta cai na lista de Ajustes", async ({ page }) => {
  await page.goto("/ajustes/expediente");
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(/\/ajustes$/);
});

test("link antigo /ajustes#google abre a seção Calendários", async ({ page }) => {
  await page.goto("/ajustes#google");
  await expect(page).toHaveURL(/\/ajustes\/calendarios#google$/);
  await expect(page.getByRole("heading", { level: 1, name: "Calendários" })).toBeVisible();
});

test("Notificação sem texto longo nem aviso de teste; Ajustes sem histórico de versões", async ({ page }) => {
  await page.goto("/ajustes/notificacoes");
  await expect(page.getByRole("heading", { name: "Notificação" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar aviso de teste" })).toHaveCount(0);
  await page.goto("/ajustes");
  await expect(page.getByRole("button", { name: "Verificar atualização" })).toBeVisible();
  await expect(page.getByText("O que mudou")).toHaveCount(0);
});

for (const href of [
  "/ajustes",
  "/ajustes/whatsapp",
  "/ajustes/calendarios",
  "/ajustes/notificacoes",
  "/ajustes/mensagens",
  "/ajustes/expediente",
  "/ajustes/endereco",
]) {
  test(`acessibilidade: ${href} sem violações sérias`, async ({ page }) => {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  });
}

test("Mensagens: aviso ao remarcar ligado, com prévia sem o nome da cliente, e desliga salvando", async ({ page }) => {
  await page.goto("/ajustes/mensagens");
  const passo = page.getByRole("region", { name: "Ao remarcar" });
  const aviso = passo.getByRole("switch", { name: "Avisar a cliente ao remarcar" });
  await expect(aviso).toHaveAttribute("aria-checked", "true");
  await expect(passo.getByText(/Seu horário de Alongamento foi remarcado/)).toBeVisible();
  await aviso.click();
  await page.getByRole("button", { name: "Salvar mensagens" }).click();
  await expect(page).toHaveURL(/\/ajustes$/);
  await page.goto("/ajustes/mensagens");
  await expect(page.getByRole("switch", { name: "Avisar a cliente ao remarcar" })).toHaveAttribute("aria-checked", "false");
});
