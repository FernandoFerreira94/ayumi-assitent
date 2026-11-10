import { expect, test } from "@playwright/test";

// O splash some em teste automatizado (navigator.webdriver); aqui finge ser uma pessoa abrindo o app
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
});

test("abrir o app mostra o splash uma vez; recarregar na mesma abertura não repete", async ({ page }) => {
  await page.goto("/login");
  const splash = page.locator(".splash");
  await expect(splash).toBeVisible();
  await expect(splash).toContainText("sua agenda com carinho");
  // Não segura o toque: o login por baixo já responde
  await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeEnabled();
  await expect(splash).toHaveCount(0, { timeout: 7000 });

  await page.reload();
  await expect(page.locator(".splash")).toBeHidden();
});

test("o nome é a marca: bubbly em Nunito grossa, com as bolhinhas subindo", async ({ page }) => {
  await page.goto("/login");
  const word = page.getByRole("heading", { level: 1, name: "bubbly" }).locator(":scope > span");
  const [weight, bubbles] = await word.evaluate((el) => [
    getComputedStyle(el).fontWeight,
    el.querySelectorAll("span[aria-hidden='true']").length,
  ]);
  expect(weight).toBe("900");
  expect(bubbles).toBe(2);
});
