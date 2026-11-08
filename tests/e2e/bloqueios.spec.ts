import { expect, test } from "./fixtures";

test("bloqueia um horário, mostra na agenda e remove com desfazer", async ({ page }) => {
  await page.goto("/calendario");
  await page.getByRole("button", { name: "Bloquear" }).click();
  await page.getByLabel("Início").selectOption("12:00");
  await page.getByLabel("Fim").selectOption("13:00");
  await page.getByLabel("Motivo (opcional)").fill("Almoço");
  await page.getByRole("button", { name: "Bloquear", exact: true }).last().click();
  await expect(page.getByText("Horário bloqueado")).toBeVisible();
  const bloco = page.getByRole("button", { name: /Bloqueado · Almoço/ });
  await expect(bloco).toContainText("12:00–13:00");

  // Na linha do dia, tocar no bloco abre a folha com Remover
  await bloco.click();
  await page.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Bloqueio removido")).toBeVisible();
  await expect(bloco).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("12:00–13:00")).toBeVisible();
});

test("fim antes do início mostra erro claro", async ({ page }) => {
  await page.goto("/calendario");
  await page.getByRole("button", { name: "Bloquear" }).click();
  await page.getByLabel("Início").selectOption("14:00");
  await page.getByLabel("Fim").selectOption("13:00");
  await page.getByRole("button", { name: "Bloquear", exact: true }).last().click();
  await expect(page.getByRole("alert").filter({ hasText: "O fim precisa ser depois do início" })).toBeVisible();
});
