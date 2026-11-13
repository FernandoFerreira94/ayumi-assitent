// tests/e2e/largura.spec.ts
import { expect, test } from "./fixtures";

test("menu lateral no lugar da barra do rodapé", async ({ page }) => {
  await page.goto("/agenda");
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(nav).toBeVisible();
  await expect(page.locator(".tabbar")).toBeHidden();
  await expect(nav.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Vagas" }).click();
  await expect(page).toHaveURL(/\/vagas$/);
  await expect(nav.getByRole("link", { name: "Vagas" })).toHaveAttribute("aria-current", "page");
});

test("a coluna não fica presa nos 520 px do celular", async ({ page }) => {
  await page.goto("/ajustes");
  const box = await page.locator("main").first().boundingBox();
  expect(box!.width).toBeGreaterThan(600);
});

test("N abre o novo agendamento como painel lateral, e Fechar fecha", async ({ page }) => {
  await page.goto("/agenda");
  const sheet = page.getByRole("dialog").last();
  // O atalho só existe depois da hidratação; repete a tecla até o ouvinte estar ligado
  await expect(async () => {
    await page.keyboard.press("n");
    await expect(sheet).toBeVisible({ timeout: 1000 });
  }).toPass();
  const vp = page.viewportSize()!;
  const box = (await sheet.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(vp.width - 2);
  expect(box.height).toBeGreaterThan(vp.height - 2);
  await sheet.getByRole("button", { name: "Fechar" }).click();
  await expect(sheet).toBeHidden();
});

test("alvos do menu têm pelo menos 44 px", async ({ page }) => {
  await page.goto("/agenda");
  const links = page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link");
  for (const link of await links.all()) {
    const b = (await link.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});
