import { expect, test } from "./fixtures";

test("expediente salvo e vagas listadas com texto para copiar", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/vagas");
  await expect(page.getByText("Nenhum serviço cadastrado")).toBeVisible();

  await page.goto("/ajustes");
  await page.getByLabel("Nome").fill("Gel");
  await page.getByLabel("Valor (R$)").fill("100");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.getByText("Serviço adicionado")).toBeVisible();

  // abre todos os dias das 06:00 às 22:00 para não depender do dia da semana de hoje
  for (let i = 0; i < 7; i++) {
    await page.locator(`input[name="open-${i}"]`).check();
    await page.locator(`select[name="opens-${i}"]`).selectOption("06:00");
    await page.locator(`select[name="closes-${i}"]`).selectOption("22:00");
  }
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByText("Expediente salvo")).toBeVisible();

  await page.goto("/vagas");
  await expect(page.getByRole("link", { name: "Gel" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("list").first()).toBeVisible();
  await page.getByRole("button", { name: "Copiar texto para divulgar" }).click();
  await expect(page.getByText("Texto copiado")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Horários disponíveis para Gel");
});
