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

test("o nome tem o par bb em outra cor", async ({ page }) => {
  await page.goto("/login");
  const h1 = page.getByRole("heading", { level: 1, name: "bubbly" });
  const colors = await h1.evaluate((el) => {
    const word = el.firstElementChild as HTMLElement;
    return [getComputedStyle(word).color, getComputedStyle(word.querySelector("span")!).color];
  });
  expect(colors[0]).not.toBe(colors[1]);
});
