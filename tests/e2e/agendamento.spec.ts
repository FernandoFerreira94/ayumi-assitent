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
  // Expediente padrão fecha no domingo: pula para segunda
  let dia = addDays(todayStr(), 1);
  if (new Date(`${dia}T12:00:00Z`).getUTCDay() === 0) dia = addDays(dia, 1);
  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  const sheet = page.getByRole("dialog", { name: "Novo agendamento" });
  // Passo 1: uma pergunta por vez; tocar na cliente avança
  await expect(sheet.getByRole("heading", { name: "Para quem?" })).toBeVisible();
  await sheet
    .getByRole("button", { name: /Ana Lima/ })
    .last()
    .click();
  // Passo 2: vários serviços, total e duração no rodapé
  await expect(sheet.getByRole("heading", { name: "Qual serviço?" })).toBeVisible();
  await sheet.getByRole("button", { name: /Escova/ }).click();
  await sheet.getByRole("button", { name: /Hidratação/ }).click();
  await expect(sheet.getByText(/2 serviços · 2h/)).toBeVisible();
  await expect(sheet.getByText("R$ 150,00")).toBeVisible();
  await sheet.getByRole("button", { name: "Continuar" }).click();
  // Passo 3: só os horários livres que cabem; tocar num horário avança
  await expect(sheet.getByRole("heading", { name: "Quando?" })).toBeVisible();
  await expect(sheet.getByText(/Só aparecem horários com 2h livres/)).toBeVisible();
  await sheet.getByRole("group", { name: "Manhã" }).getByRole("button", { name: "10:00", exact: true }).click();
  // Passo 4: resumo com o total, desconto opcional num diálogo
  await expect(sheet.getByRole("heading", { name: "Tudo certo?" })).toBeVisible();
  await page.getByRole("button", { name: /^Desconto/ }).click();
  const desc = page.getByRole("dialog", { name: "Desconto" });
  await desc.getByLabel("Desconto em porcentagem").fill("10");
  await expect(desc.getByText(/fica R\$\s135,00/)).toBeVisible();
  await desc.getByRole("button", { name: "Aplicar" }).click();
  await expect(sheet.getByText("R$ 135,00").first()).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Agendar", exact: true })).toBeInViewport({ ratio: 0.99 });

  // Voltar e trocar o horário mantém o resto
  await sheet.getByRole("button", { name: /^Quando:/ }).click();
  await sheet.getByRole("group", { name: "Manhã" }).getByRole("button", { name: "10:00", exact: true }).click();
  await expect(sheet.getByText("R$ 135,00").first()).toBeVisible();

  await sheet.getByRole("button", { name: "Agendar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  const bloco = page.getByRole("button", { name: /Ana Lima, Escova \+ Hidratação, 10:00/ });
  await expect(bloco).toBeVisible();
  await expect(page.getByText("R$ 135,00").first()).toBeVisible();
});

test("tocar num horário de Vagas abre o agendamento já preenchido", async ({ page }) => {
  await prepara(page);
  // Todos os dias abertos, para não depender do dia da semana de hoje
  await page.goto("/ajustes/expediente");
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
  // Serviço e horário vieram de Vagas: só falta a cliente
  await expect(sheet.getByRole("heading", { name: "Para quem?" })).toBeVisible();
  await sheet
    .getByRole("button", { name: /Ana Lima/ })
    .last()
    .click();
  await expect(sheet.getByRole("heading", { name: "Tudo certo?" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: /^Quando: .* às 21:00/ })).toBeVisible();
  await expect(sheet.getByText("R$ 80,00").first()).toBeVisible();
});
