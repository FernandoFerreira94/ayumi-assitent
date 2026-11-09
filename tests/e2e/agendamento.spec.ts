import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addDays, todayStr } from "../../src/lib/dates";

async function servico(page: Page, nome: string, preco: string) {
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill(nome);
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill(preco);
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
}

/** Dois serviços e uma cliente pela interface, como a dona faria. */
async function prepara(page: Page) {
  await page.goto("/servicos");
  await servico(page, "Escova", "80,00");
  await servico(page, "Hidratação", "70,00");

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Ana Lima");
  await page.getByLabel("WhatsApp").fill("11987650000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();
}

test("agenda dois serviços com desconto: soma duração e valor", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Ana Lima/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Escova/ }).click();
  await page.getByRole("button", { name: "Adicionar mais um" }).click();
  await page.getByRole("button", { name: "Serviço 2" }).click();
  await page.getByRole("button", { name: /Hidratação/ }).click();
  await expect(page.getByText("Total R$ 150,00")).toBeVisible();

  await page.getByText("%", { exact: true }).click();
  await page.getByLabel("Desconto em porcentagem").fill("10");
  await expect(page.getByText("Total R$ 135,00")).toBeVisible();

  await page.getByLabel("Horário").selectOption("10:00");
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  const bloco = page.getByRole("button", { name: /Ana Lima, Escova \+ Hidratação, 10:00/ });
  await expect(bloco).toBeVisible();
  await expect(page.getByText("R$ 135,00").first()).toBeVisible();
});

test("tocar num horário de Vagas abre o agendamento já preenchido", async ({ page }) => {
  await prepara(page);
  // Todos os dias abertos, para não depender do dia da semana de hoje
  await page.goto("/ajustes");
  for (let i = 0; i < 7; i++) {
    await page.locator(`input[name="open-${i}"]`).check();
    await page.locator(`select[name="opens-${i}"]`).selectOption("06:00");
    await page.locator(`select[name="closes-${i}"]`).selectOption("22:00");
  }
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByText("Expediente salvo")).toBeVisible();

  await page.goto("/vagas");
  const slot = page.getByRole("button", { name: /^Agendar .* às 21:00$/ }).first();
  // Antes da hidratação o toque não abre a folha: repete até abrir
  const sheet = page.getByRole("dialog", { name: "Novo agendamento" });
  await expect(async () => {
    await slot.click({ timeout: 1000 });
    await expect(sheet).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(sheet.getByLabel("Horário")).toHaveValue("21:00");
  await expect(sheet.getByText("Total R$ 80,00")).toBeVisible();
});
