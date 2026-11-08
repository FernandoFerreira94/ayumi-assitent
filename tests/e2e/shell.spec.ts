import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const TABS = [
  { href: "/agenda", name: "Painel", heading: /^(Bom dia|Boa tarde|Boa noite)/ },
  { href: "/clientes", name: "Clientes", heading: "Clientes" },
  { href: "/vagas", name: "Vagas", heading: "Vagas" },
  { href: "/ajustes", name: "Ajustes", heading: "Ajustes" },
];

test("a raiz abre a agenda", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/agenda$/);
});

// O nav em leque só mostra as telas depois de aberto pelo botão central.
// Toque antes da hidratação não abre nada, então repete até o leque abrir de fato.
const openFan = (page: import("@playwright/test").Page) =>
  expect(async () => {
    const toggle = page.locator(".fan-toggle");
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click({ timeout: 1000 });
    await expect(toggle).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
  }).toPass();

test("as 4 abas navegam e marcam a aba atual", async ({ page }) => {
  await page.goto("/agenda");
  for (const t of TABS) {
    await openFan(page);
    await page.getByRole("link", { name: t.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${t.href}$`));
    await expect(page.getByRole("heading", { level: 1, name: t.heading })).toBeVisible();
    await openFan(page);
    await expect(page.getByRole("link", { name: t.name, exact: true })).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");
  }
});

test("fora da agenda, a seta volta para ela", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page.getByRole("link", { name: "Voltar para a agenda" })).toHaveCount(0);
  for (const t of TABS.slice(1)) {
    await page.goto(t.href);
    await page.getByRole("link", { name: "Voltar para a agenda" }).click();
    await expect(page).toHaveURL(/\/agenda$/);
  }
});

test("alvos de toque do nav têm pelo menos 44 px", async ({ page }) => {
  // Sem animação: o leque abre com scale e mediria o botão no meio da transição
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agenda");
  const toggle = await page.getByRole("button", { name: "Abrir navegação" }).boundingBox();
  expect(toggle!.width).toBeGreaterThanOrEqual(44);
  await openFan(page);
  for (const t of TABS) {
    const link = page.getByRole("link", { name: t.name, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
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
