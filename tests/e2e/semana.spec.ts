import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { weekOf } from "../../src/features/appointments/agenda-grid";
import { addDays, todayStr } from "../../src/lib/dates";

test.use({ viewport: { width: 1440, height: 1000 } });

/** Expediente todo aberto, serviço e cliente, e um atendimento na segunda da semana que vem às 10h. */
async function prepara(page: Page, dia: string) {
  await page.goto("/ajustes/expediente");
  for (let i = 0; i < 7; i++) {
    await page.locator(`input[name="open-${i}"]`).check();
    await page.locator(`select[name="opens-${i}"]`).selectOption("06:00");
    await page.locator(`select[name="closes-${i}"]`).selectOption("22:00");
  }
  await page.getByRole("button", { name: "Salvar expediente" }).click();
  await expect(page.getByText("Expediente salvo")).toBeVisible();

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

  await page.goto(`/calendario?d=${dia}`);
  await page.getByRole("button", { name: "Agendar", exact: true }).first().click();
  await page.getByRole("button", { name: "Cliente" }).click();
  await page.getByRole("button", { name: /Ana Lima/ }).click();
  await page.getByRole("button", { name: "Serviço" }).click();
  await page.getByRole("button", { name: /Escova/ }).click();
  await page.getByLabel("Horário").selectOption("10:00");
  await page.getByRole("button", { name: "Agendar", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: /Agendado/ })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
}

/** Arrasta com o mouse: `cols` dias para o lado e `px` na vertical. */
async function arrasta(page: Page, nome: RegExp, cols: number, px: number) {
  const bloco = page.getByRole("button", { name: nome });
  const box = (await bloco.boundingBox())!;
  const col = (await page.getByRole("link", { name: /^Abrir Seg/ }).boundingBox())!.width;
  const x = box.x + box.width / 2;
  const y = box.y + 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 10, y + 4, { steps: 2 });
  await page.mouse.move(x + cols * col, y + px, { steps: 8 });
  await page.mouse.up();
}

test("arrastar na semana muda o dia e o horário, com Desfazer", async ({ page }) => {
  const semana = weekOf(addDays(todayStr(), 7));
  const seg = semana[1];
  const qua = semana[3];
  await prepara(page, seg);

  await page.goto(`/calendario?v=semana&d=${seg}`);
  await expect(page.getByRole("button", { name: /^Ana, Escova, 10:00–11:00/ })).toBeVisible();

  // 56 px por hora na semana: +2 colunas e +56 px = quarta às 11h
  await arrasta(page, /^Ana, Escova, 10:00/, 2, 56);
  await expect(page.getByText(`Ana foi para qua ${Number(qua.slice(8))}, 11:00`)).toBeVisible();

  // Abre a quarta: o atendimento está lá
  await page.goto(`/calendario?d=${qua}`);
  await expect(page.getByRole("button", { name: /Ana Lima, Escova, 11:00/ })).toBeVisible();

  // Desfazer pela semana devolve para segunda às 10h
  await page.goto(`/calendario?v=semana&d=${seg}`);
  await arrasta(page, /^Ana, Escova, 11:00/, -2, -56);
  await expect(page.getByText(`Ana foi para seg ${Number(seg.slice(8))}, 10:00`)).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText(`Ana voltou para qua ${Number(qua.slice(8))}, 11:00`)).toBeVisible();
});

test("clicar sem arrastar ainda abre a linha do dia", async ({ page }) => {
  const semana = weekOf(addDays(todayStr(), 7));
  const seg = semana[1];
  await prepara(page, seg);

  await page.goto(`/calendario?v=semana&d=${seg}`);
  await page.getByRole("button", { name: /^Ana, Escova, 10:00/ }).click();
  await expect(page).toHaveURL(new RegExp(`/calendario\\?d=${seg}`));
});
