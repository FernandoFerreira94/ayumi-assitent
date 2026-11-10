import { expect, test } from "@playwright/test";
import postgres from "postgres";

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
  await expect(page.getByText(/^(Esta conta|Não foi possível)/)).toContainText("Não foi possível entrar");
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

test.describe("login por e-mail e senha", () => {
  const email = `novo@e2e.test`;

  test.beforeAll(async () => {
    // rodadas locais repetidas: remove a conta criada antes
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    await sql`delete from "user" where email = ${email}`;
    await sql.end();
  });

  test("e-mail fora da lista não consegue criar conta", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Criar conta com e-mail" }).click();
    await page.getByLabel("Nome").fill("Intrusa");
    await page.getByLabel("E-mail").fill("intruso@e2e.test");
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura-123");
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await expect(page.getByText("Esta conta não tem acesso.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("cria conta autorizada, sai, erra a senha e entra de novo", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Criar conta com e-mail" }).click();
    await page.getByLabel("Nome").fill("Yumi");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura-123");
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await expect(page).toHaveURL(/\/agenda/);
    await expect(page.getByRole("region", { name: "Linha do dia" })).toBeVisible();

    await context.clearCookies();
    await page.goto("/login");
    await page.getByRole("button", { name: "Continuar com e-mail" }).click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada-999");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    // o Bubbly reage ao toque e não atrapalha o formulário
    await page.getByRole("button", { name: "Bubbly, toque para brincar" }).click();
    // Só a animação: nenhuma legenda dizendo o que ele está fazendo
    await expect(page.getByText("Pulinho")).toHaveCount(0);

    await page.getByLabel("Senha", { exact: true }).fill("senha-segura-123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/agenda/);
  });
});
