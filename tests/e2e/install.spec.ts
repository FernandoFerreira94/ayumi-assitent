import { test as anonymous } from "@playwright/test";
import { expect, test } from "./fixtures";

// Sem sessão: o login de quem já entrou redireciona para a agenda
anonymous("no iPhone, o login ensina a pôr o app na tela de início", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Como instalar o app no celular" }).click();
  await expect(page.getByRole("heading", { name: "Instalar na tela de início" })).toBeVisible();
  await expect(page.getByText("Adicionar à Tela de Início")).toBeVisible();
  // O passo a passo do Android só aparece no Android ou no computador
  await expect(page.getByText("Instalar app")).toHaveCount(0);
});

test("aberto pelo ícone (já instalado), o botão some", async ({ page }) => {
  await page.addInitScript(() => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (q: string) =>
      q.includes("standalone")
        ? ({ ...real(q), matches: true, media: q, addEventListener() {}, removeEventListener() {} } as MediaQueryList)
        : real(q);
  });
  await page.goto("/ajustes");
  await expect(page.getByRole("button", { name: "Rever o tour do app" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Como instalar o app no celular" })).toHaveCount(0);
});

anonymous("ícone da tela de início do iPhone está publicado", async ({ request }) => {
  const res = await request.get("/apple-icon.png");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("image/png");
});
