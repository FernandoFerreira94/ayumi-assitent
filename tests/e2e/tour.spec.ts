import { expect, test } from "./fixtures";

test.use({ tourDone: false });

test("primeiro acesso: o tour pede toques, avança e não volta depois", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agenda");
  const card = page.getByRole("dialog");
  await expect(card.getByRole("heading", { name: "Oi, eu sou o Mimo!" })).toBeVisible();
  await card.getByRole("button", { name: "Começar" }).click();

  // Passo de toque: sem botão, só o destaque avança
  await expect(card.getByText("Toque no destaque")).toBeVisible();
  await page.locator("[data-tour='bubble']").click();
  await expect(card.getByRole("heading", { name: "Agendar e bloquear" })).toBeVisible();
  await card.getByRole("button", { name: "Próximo" }).click();

  await expect(card.getByRole("heading", { name: "O menu fica aqui" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await expect(card.getByRole("heading", { name: "Tudo a um toque" })).toBeVisible();
  await card.getByRole("button", { name: "Próximo" }).click();
  await card.getByRole("button", { name: "Próximo" }).click();
  await card.getByRole("button", { name: "Começar a usar" }).click();
  await expect(card).toBeHidden();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("pular o tour fecha e Ajustes reabre", async ({ page }) => {
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Pular tour" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.goto("/ajustes");
  await page.getByRole("button", { name: "Rever o tour do app" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByRole("heading", { name: "Oi, eu sou o Mimo!" })).toBeVisible();
});
