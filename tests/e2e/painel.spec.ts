import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addDays, todayStr } from "../../src/lib/dates";

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

test("fora do expediente não bloqueia: a folha só avisa e o agendamento sai", async ({ page }) => {
  await prepara(page);
  const dia = addDays(todayStr(), 1);
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Ana Lima/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Escova/ }).click();
  const aviso = page.getByText("Esse horário está fora do expediente");
  // Expediente padrão 9h-18h (domingo fechado): 21h cai fora em qualquer dia
  await page.getByLabel("Horário").selectOption("21:00");
  await expect(aviso).toBeVisible();
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByRole("button", { name: /Ana Lima, Escova, 21:00/ })).toBeVisible();

  // Painel do dia: sem Bloquear/Agendar, com os ganhos e o olhinho que lembra a escolha
  await page.goto(`/agenda?d=${dia}`);
  await expect(page.getByRole("button", { name: "Bloquear" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Agendar", exact: true })).toHaveCount(0);
  const ganhos = page.getByRole("region", { name: "Ganhos do dia" });
  await expect(ganhos.getByText("Falta R$ 80,00")).toBeVisible();
  await ganhos.getByRole("button", { name: "Esconder valores" }).click();
  await expect(ganhos.getByText("R$ 80,00")).toHaveCount(0);
  await page.reload();
  await expect(ganhos.getByRole("button", { name: "Mostrar valores" })).toBeVisible();
  await expect(ganhos.getByText(/80,00/)).toHaveCount(0);
  await ganhos.getByRole("button", { name: "Mostrar valores" }).click();
  await expect(ganhos.getByText("Falta R$ 80,00")).toBeVisible();
});

test("a fala da Bolha aparece num balão que some ao toque", async ({ page }) => {
  await page.goto("/agenda");
  const balao = page.getByRole("button", { name: /Toque para fechar/ });
  await expect(balao).toBeVisible();
  await balao.click();
  await expect(balao).toHaveCount(0);
  // Tocar na Bolha traz a fala de volta
  await page.locator("[data-tour='bubble']").click();
  await expect(page.getByRole("button", { name: /Toque para fechar/ })).toBeVisible();
});
