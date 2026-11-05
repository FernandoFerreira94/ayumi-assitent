import { expect, test } from "@playwright/test";

test("sem sessão, a agenda manda para o login", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
});

test("login mostra mensagem quando a conta não tem acesso", async ({ page }) => {
  await page.goto("/login?error=NOT_ALLOWED");
  await expect(page.getByText(/^(Esta conta|Não foi possível)/)).toHaveText("Esta conta não tem acesso.");
});

test("login mostra mensagem genérica em outros erros", async ({ page }) => {
  await page.goto("/login?error=oauth_failed");
  await expect(page.getByText(/^(Esta conta|Não foi possível)/)).toContainText("Não foi possível entrar com o Google");
});

test("clicar em entrar mostra o carregamento", async ({ page }) => {
  await page.route("**/api/auth/sign-in/social", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.abort();
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar com Google" }).click();
  await expect(page.getByRole("button", { name: "Abrindo o Google…" })).toBeDisabled();
});
