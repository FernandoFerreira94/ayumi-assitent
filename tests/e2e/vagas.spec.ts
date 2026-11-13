import { expect, test } from "./fixtures";

test("expediente salvo e vagas listadas com texto para copiar", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/vagas");
  await expect(page.getByText("Nenhum serviço cadastrado")).toBeVisible();

  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Gel");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("100");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();

  // abre todos os dias das 06:00 às 22:00 para não depender do dia da semana de hoje
  await page.goto("/ajustes/expediente");
  for (let i = 0; i < 7; i++) {
    await page.locator(`input[name="open-${i}"]`).check();
    await page.locator(`select[name="opens-${i}"]`).selectOption("06:00");
    await page.locator(`select[name="closes-${i}"]`).selectOption("22:00");
  }
  // Pausa de almoço: some das vagas
  await page.getByLabel("Pausa", { exact: true }).check();
  await page.getByLabel("Pausa: começa").selectOption("12:00");
  await page.getByLabel("Pausa: termina").selectOption("13:00");
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByText("Expediente salvo")).toBeVisible();
  // Depois de salvar o formulário mantém o que foi escolhido (antes o <select> voltava ao horário antigo)
  await expect(page.locator(`select[name="closes-0"]`)).toHaveValue("22:00");
  await page.reload();
  await expect(page.locator(`select[name="opens-0"]`)).toHaveValue("06:00");

  await page.goto("/vagas");
  await expect(page.getByRole("link", { name: "Gel" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("list").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /às 14:00$/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /às 12:00$/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Copiar texto para divulgar" }).click();
  await page.getByRole("button", { name: "Copiar texto", exact: true }).click();
  await expect(page.getByText("Texto copiado")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Horários disponíveis para Gel");
  expect(copied).toMatch(/\*\w{3}, \d{2}\/\d{2}\*/);
});

test("+ Serviço em Vagas abre a folha por cima, sem sair da tela", async ({ page }) => {
  await page.goto("/vagas");
  // Sem serviço: o vazio já oferece criar na folha
  const trigger = page.getByRole("button", { name: /^(\+ Serviço|Novo serviço)$/ });
  await expect(async () => {
    await trigger.first().click({ timeout: 1000 });
    await expect(page.getByRole("dialog", { name: "Novo serviço" })).toBeVisible({ timeout: 1000 });
  }).toPass();
  const sheet = page.getByRole("dialog", { name: "Novo serviço" });
  await sheet.getByRole("textbox", { name: "Nome", exact: true }).fill("Spa dos pés");
  await sheet.getByRole("textbox", { name: /Preço/ }).fill("60,00");
  await sheet.getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/vagas/);
  await expect(page.getByRole("link", { name: "Spa dos pés" })).toBeVisible();
});
