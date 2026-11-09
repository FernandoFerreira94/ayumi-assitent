import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const TABS = [
  { href: "/agenda", name: "Painel", heading: /^(Bom dia|Boa tarde|Boa noite)/ },
  { href: "/calendario", name: "Calendário", heading: "Calendário" },
  { href: "/financeiro", name: "Financeiro", heading: "Financeiro" },
  { href: "/clientes", name: "Clientes", heading: "Clientes" },
];

test("a raiz abre a agenda", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/agenda$/);
});

const tab = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("navigation", { name: "Navegação" }).getByRole("link", { name, exact: true });

test("as abas navegam e marcam a aba atual", async ({ page }) => {
  await page.goto("/agenda");
  for (const t of TABS) {
    await tab(page, t.name).click();
    await expect(page).toHaveURL(new RegExp(`${t.href}$`));
    await expect(page.getByRole("heading", { level: 1, name: t.heading })).toBeVisible();
    await expect(tab(page, t.name)).toHaveAttribute("aria-current", "page");
  }
});

test("as telas principais mostram o avatar do menu, sem seta", async ({ page }) => {
  for (const href of ["/agenda", "/calendario", "/financeiro", "/clientes", "/vagas", "/ajustes"]) {
    await page.goto(href);
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar", exact: true })).toHaveCount(0);
  }
});

test("tela secundária: a seta volta para onde estava e, aberta direto, cai na agenda", async ({ page }) => {
  await page.goto("/servicos");
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(/\/agenda$/);

  await page.goto("/clientes");
  // Antes da hidratação o avatar não abre o menu: repete até abrir
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(async () => {
    await page.getByRole("button", { name: "Abrir menu" }).click({ timeout: 1000 });
    await expect(menu).toBeVisible({ timeout: 1000 });
  }).toPass();
  await menu.getByRole("link", { name: "Serviços" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Serviços" })).toBeVisible();
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(/\/clientes$/);
});

test("alvos de toque da barra têm pelo menos 44 px", async ({ page }) => {
  await page.goto("/agenda");
  const nav = page.getByRole("navigation", { name: "Navegação" });
  for (const el of [...TABS.map((t) => tab(page, t.name)), nav.getByRole("button", { name: "Novo agendamento", exact: true })]) {
    const box = await el.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

test("página inexistente mostra o 404 com saída", async ({ page }) => {
  const res = await page.goto("/nada-aqui");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Não encontramos isto" })).toBeVisible();
  await page.getByRole("link", { name: "Voltar para a agenda" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
});

test("tela offline existe e explica", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "Você está sem internet" })).toBeVisible();
});

test("manifest e ícones do PWA estão publicados", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.display).toBe("standalone");
  expect(m.start_url).toBe("/agenda");
  for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  expect((await request.get("/sw.js")).ok()).toBe(true);
});

test("faixa de offline aparece sem internet", async ({ page, context }) => {
  await page.goto("/agenda");
  await context.setOffline(true);
  await expect(page.getByText("Você está sem internet. Mostrando o que foi salvo.")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Você está sem internet. Mostrando o que foi salvo.")).toBeHidden();
});

for (const t of TABS) {
  test(`acessibilidade: ${t.href} sem violações sérias`, async ({ page }) => {
    await page.goto(t.href);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  });
}
