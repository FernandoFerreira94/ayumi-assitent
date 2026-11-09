import { expect, test } from "./fixtures";
import { todayStr } from "../../src/lib/dates";

test("mudança feita em outro aparelho mostra o botão Atualizar, que traz a novidade sem recarregar", async ({
  page,
  context,
}) => {
  await page.goto(`/calendario?d=${todayStr()}`);
  const atualizar = page.getByRole("button", { name: /Atualizar/ });
  await expect(atualizar).toHaveCount(0);
  // Marca a página: se ela recarregasse por inteiro, a marca sumiria
  await page.evaluate(() => ((window as { semRecarregar?: boolean }).semRecarregar = true));

  // "Outro aparelho": mesma conta, outra aba
  const outro = await context.newPage();
  await outro.goto(`/calendario?d=${todayStr()}`);
  await outro.getByRole("button", { name: "Bloquear" }).click();
  await outro.getByLabel("Início").selectOption("12:00");
  await outro.getByLabel("Fim").selectOption("13:00");
  await outro.getByLabel("Motivo (opcional)").fill("Almoço");
  await outro.getByRole("button", { name: "Bloquear", exact: true }).last().click();
  await expect(outro.getByText("Horário bloqueado")).toBeVisible();
  await outro.close();

  // Voltar para o app confere na hora, sem esperar os 30 s
  await page.bringToFront();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await atualizar.click();
  await expect(page.getByRole("button", { name: /Bloqueado · Almoço/ })).toBeVisible();
  await expect(atualizar).toHaveCount(0);
  expect(await page.evaluate(() => (window as { semRecarregar?: boolean }).semRecarregar)).toBe(true);
});

test("o que a própria tela fez não vira aviso de atualização", async ({ page }) => {
  await page.goto(`/calendario?d=${todayStr()}`);
  await page.getByRole("button", { name: "Bloquear" }).click();
  await page.getByLabel("Início").selectOption("12:00");
  await page.getByLabel("Fim").selectOption("13:00");
  await page.getByRole("button", { name: "Bloquear", exact: true }).last().click();
  await expect(page.getByText("Horário bloqueado")).toBeVisible();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  // Dá tempo da conferência ir e voltar do servidor antes de afirmar que nada apareceu
  await page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/calendario"));
  await page.waitForTimeout(300);
  await expect(page.getByRole("button", { name: /Atualizar/ })).toHaveCount(0);
});
