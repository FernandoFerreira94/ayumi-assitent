import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addDays, todayStr } from "../../src/lib/dates";

/** Serviço e cliente pela interface, como a dona faria. */
async function prepara(page: Page) {
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Escova");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("80,00");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();

  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Ana Lima");
  await page.getByLabel("WhatsApp").fill("11987650000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();
}

async function agenda(page: Page, dia: string, hora: string) {
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Ana Lima/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Escova/ }).click();
  await page.getByLabel("Horário").selectOption(hora);
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
}

test("horário fora da meia hora continua o mesmo ao abrir Remarcar", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await agenda(page, dia, "09:00");

  // Setas do teclado movem de 15 em 15, como o arraste
  const bloco = page.getByRole("button", { name: /Ana Lima, Escova, 09:00/ });
  await bloco.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText("Ana foi para 09:15")).toBeVisible();

  await page.getByRole("button", { name: /Ana Lima, Escova, 09:15/ }).click();
  await page.getByRole("button", { name: "Mais ações" }).click();
  await page.getByRole("button", { name: "Remarcar" }).click();
  await expect(page.getByLabel("Horário")).toHaveValue("09:15");
});

test("o dia abre no topo, sem rolar sozinho", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 2);
  await agenda(page, dia, "18:00");

  await page.goto(`/calendario?d=${dia}`);
  await expect(page.getByRole("button", { name: /Ana Lima, Escova, 18:00/ })).toBeAttached();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("Faltou mostra Desfazer e volta ao status anterior", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await agenda(page, dia, "10:00");

  await page.getByRole("button", { name: /Ana Lima, Escova, 10:00/ }).click();
  await page.getByRole("button", { name: "Mais ações" }).click();
  await page.getByRole("button", { name: "Faltou" }).click();
  await expect(page.getByText("Marcado como faltou")).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("Aguardando confirmação").first()).toBeVisible();
});
