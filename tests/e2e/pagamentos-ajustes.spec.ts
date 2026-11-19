import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("Ajustes > Pagamentos: padrões aprovados, salvar e continuar salvo", async ({ page }) => {
  await page.goto("/ajustes");
  await expect(page.getByRole("link", { name: /^Pagamentos/ })).toContainText("Sinal 30%");
  await page.getByRole("link", { name: /^Pagamentos/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Pagamentos" })).toBeVisible();

  // Padrões: sinal 30%, 24h, sinal fica em cima da hora e na falta, sessão usada na falta, pacote 90 dias
  await expect(page.getByLabel("Sinal sugerido")).toHaveValue("30");
  await expect(page.getByLabel("Antecedência para virar crédito")).toHaveValue("24");
  await expect(page.getByRole("switch", { name: "Em cima da hora, o sinal fica para o salão" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Faltou, o sinal fica para o salão" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Faltou, a sessão do pacote conta como usada" })).toBeChecked();
  await expect(page.getByLabel("Validade padrão dos pacotes")).toHaveValue("90");

  await page.getByLabel("Sinal sugerido").selectOption("50");
  await page.getByLabel("Antecedência para virar crédito").selectOption("48");
  await expect(page.getByText("Cancelou com 48 horas ou mais")).toBeVisible();
  await page.getByRole("switch", { name: "Faltou, a sessão do pacote conta como usada" }).click();
  await expect(page.getByText("A sessão volta para o pacote da cliente.")).toBeVisible();
  await page.getByLabel("Chave Pix do salão").fill("salao@pix.com");
  await page.getByRole("button", { name: "Salvar pagamentos" }).click();
  await expect(page.getByText("Pagamentos salvos")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Sinal sugerido")).toHaveValue("50");
  await expect(page.getByLabel("Antecedência para virar crédito")).toHaveValue("48");
  await expect(page.getByRole("switch", { name: "Faltou, a sessão do pacote conta como usada" })).not.toBeChecked();
  await expect(page.getByLabel("Chave Pix do salão")).toHaveValue("salao@pix.com");

  const a11y = await new AxeBuilder({ page }).include("main").analyze();
  expect(a11y.violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual([]);
});
