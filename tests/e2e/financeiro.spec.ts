import { expect, test } from "./fixtures";
import { todayStr } from "../../src/lib/dates";

test("o previsto da agenda abre o Financeiro, que troca de mês e lança um gasto", async ({ page }) => {
  await page.goto(`/calendario?d=${todayStr()}`);
  await page.getByRole("link", { name: /Ver financeiro/ }).click();
  await expect(page).toHaveURL(/\/financeiro$/);
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
  // Conta nova: nada concluído nem gasto ainda
  await expect(page.getByText("Nada recebido nesse mês")).toBeVisible();
  await expect(page.getByText("Nenhum gasto lançado nesse mês.")).toBeVisible();

  await page.getByRole("link", { name: "Mês anterior" }).click();
  await expect(page).toHaveURL(/m=\d{4}-\d{2}/);

  await page.getByRole("button", { name: "Lançar gasto" }).click();
  await page.getByLabel("Valor (R$)").fill("15000");
  await page.getByRole("combobox", { name: "Categoria" }).selectOption("aluguel");
  await page.getByRole("button", { name: "Lançar", exact: true }).click();
  await expect(page.getByText("Gasto lançado")).toBeVisible();
  await expect(page.getByText("Aluguel · ", { exact: false }).first()).toBeVisible();
});
