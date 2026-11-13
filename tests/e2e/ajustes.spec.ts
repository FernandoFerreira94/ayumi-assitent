import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("Ajustes é uma lista: cada linha abre a sua seção e a seta volta para a lista", async ({ page }) => {
  await page.goto("/ajustes");
  for (const [row, title] of [
    ["WhatsApp", "WhatsApp"],
    ["Calendários", "Calendários"],
    ["Notificações", "Notificações"],
    ["Mensagens para a cliente", "Mensagens"],
    ["Expediente", "Expediente"],
  ] as const) {
    await page.getByRole("link", { name: new RegExp(`^${row}`) }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/ajustes$/);
  }
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

for (const href of ["/ajustes", "/ajustes/whatsapp", "/ajustes/calendarios", "/ajustes/notificacoes", "/ajustes/mensagens", "/ajustes/expediente"]) {
  test(`acessibilidade: ${href} sem violações sérias`, async ({ page }) => {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  });
}
