import { expect, test } from "./fixtures";
import { todayStr } from "../../src/lib/dates";

test("Painel: o nome do mês abre o seletor e pula para outro mês", async ({ page }) => {
  const next = new Date().getFullYear() + 1;
  await page.goto("/agenda");
  await page.getByRole("button", { name: /trocar mês/ }).click();
  await expect(page.getByRole("heading", { name: "Escolher mês" })).toBeVisible();
  await page.getByRole("button", { name: "Próximo ano" }).click();
  await page.getByRole("link", { name: `março de ${next}` }).click();
  await expect(page).toHaveURL(new RegExp(`/agenda\\?d=${next}-03-01`));
  await expect(page.getByRole("button", { name: new RegExp(`Março de ${next}`) })).toBeVisible();
  // exact: o dia de hoje na faixa também tem "(hoje)" no nome
  await page.getByRole("link", { name: "Hoje", exact: true }).click();
  await expect(page).toHaveURL(/\/agenda$/);
});

test("Calendário: do dia para o mês, do mês para o ano e de volta", async ({ page }) => {
  const year = String(new Date().getFullYear());
  await page.goto(`/calendario?d=${todayStr()}`);
  await page.getByRole("link", { name: /Voltar para o mês/ }).click();
  await expect(page).toHaveURL(/v=mes/);
  await page.getByRole("button", { name: `Voltar para o ano de ${year}` }).click();
  await expect(page).toHaveURL(/v=ano/);
  await page.getByRole("link", { name: new RegExp(`^março de ${year}$`, "i") }).click();
  await expect(page).toHaveURL(new RegExp(`v=mes&m=${year}-03`));
  await page
    .getByRole("link", { name: new RegExp(`^1 de março|, 1 de março`) })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`d=${year}-03-01`));
});

test("Calendário abre no mês, com as semanas", async ({ page }) => {
  await page.goto("/calendario");
  await expect(page.getByRole("heading", { name: "Calendário" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Voltar para o ano de/ })).toBeVisible();
});

test("Calendário: setas e deslizar trocam o mês sem recarregar a página", async ({ page }) => {
  await page.goto("/calendario?v=mes&m=2026-05");
  await expect(page.getByRole("heading", { name: "Maio" })).toBeVisible();
  // marcador na janela: se a página recarregasse, ele sumiria
  await page.evaluate(() => ((window as unknown as { __casca: number }).__casca = 1));
  await page.getByRole("button", { name: "Próximo mês" }).click();
  await expect(page).toHaveURL(/m=2026-06/);
  await expect(page.getByRole("heading", { name: "Junho" })).toBeVisible();
  const box = (await page.locator(".cal-pager").boundingBox())!;
  const y = box.y + 200;
  await page.mouse.move(box.x + box.width - 30, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width - 30 - i * 30, y);
  await page.mouse.up();
  await expect(page).toHaveURL(/m=2026-07/);
  await expect(page.getByRole("heading", { name: "Julho" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __casca?: number }).__casca)).toBe(1);
});

test("Calendário: rolar para baixo e para cima passa pelos meses, como no iPhone", async ({ page }) => {
  await page.goto("/calendario?v=mes&m=2026-05");
  await expect(page.getByRole("heading", { name: "Maio" })).toBeVisible();
  await page.evaluate(() => ((window as unknown as { __casca: number }).__casca = 1));
  const box = page.locator(".cal-scroll");
  // já hidratou: a lista abriu rolada até maio (tem meses em cima)
  await expect.poll(() => box.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  // para baixo: o mês que chega ao topo vira o mês da URL (e as setas/ano seguem funcionando)
  await box.evaluate((el) => {
    const sec = el.querySelector<HTMLElement>('[data-month="2026-08"]')!;
    el.scrollTop = sec.offsetTop - 20;
  });
  await expect(page).toHaveURL(/m=2026-08/);
  // bem para baixo: mais meses entram sob demanda (ano seguinte)
  for (let i = 0; i < 6; i++) await box.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect(page.locator('[data-month="2027-03"]')).toHaveCount(1);
  // para cima, passando do começo: meses anteriores entram em cima sem pular a tela
  await box.evaluate((el) => {
    const sec = el.querySelector<HTMLElement>('[data-month="2026-03"]')!;
    el.scrollTop = sec.offsetTop - 20;
  });
  await expect(page).toHaveURL(/m=2026-03/);
  await box.evaluate((el) => (el.scrollTop = 0));
  await expect(page.locator('[data-month="2025-08"]')).toHaveCount(1);
  // a página não recarregou e o dia continua abrindo pelo mês
  expect(await page.evaluate(() => (window as unknown as { __casca?: number }).__casca)).toBe(1);
  await page.screenshot({ path: "test-results/rolagem-meses.png" });
});
