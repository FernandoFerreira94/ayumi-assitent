import { expect, test } from "./fixtures";

test("bloqueia um horário, mostra na agenda e remove com desfazer", async ({ page }) => {
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Bloquear" }).click();
  await page.getByLabel("Início").selectOption("12:00");
  await page.getByLabel("Fim").selectOption("13:00");
  await page.getByLabel("Motivo (opcional)").fill("Almoço");
  await page.getByRole("button", { name: "Bloquear", exact: true }).last().click();
  await expect(page.getByText("Horário bloqueado")).toBeVisible();
  await expect(page.getByText("12:00–13:00")).toBeVisible();
  await expect(page.getByText("Almoço", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText("Bloqueio removido")).toBeVisible();
  await expect(page.getByText("Dia livre")).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("12:00–13:00")).toBeVisible();
});

test("fim antes do início mostra erro claro", async ({ page }) => {
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Bloquear" }).click();
  await page.getByLabel("Início").selectOption("14:00");
  await page.getByLabel("Fim").selectOption("13:00");
  await page.getByRole("button", { name: "Bloquear", exact: true }).last().click();
  await expect(page.getByRole("alert").filter({ hasText: "O fim precisa ser depois do início" })).toBeVisible();
});
