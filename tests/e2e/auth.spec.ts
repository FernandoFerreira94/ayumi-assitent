import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
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

test("não existe cadastro por e-mail (conta nova só pelo Google)", async ({ page, request }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Criar conta com e-mail" })).toHaveCount(0);
  const r = await request.post("/api/auth/sign-up/email", {
    data: { name: "Intrusa", email: "novo@e2e.test", password: "senha-segura-123" },
    headers: { origin: "http://localhost:3100" },
  });
  expect(r.ok()).toBe(false);
});

test.describe("login por e-mail e senha", () => {
  const email = `senha@e2e.test`;

  test.beforeAll(async () => {
    // Conta com senha criada direto no banco (como fica depois de "Criar senha" em Ajustes)
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    await sql`delete from "user" where email = ${email}`;
    const uid = randomUUID();
    await sql`insert into "user" (id, name, email, "emailVerified") values (${uid}, 'Yumi', ${email}, true)`;
    await sql`insert into account (id, "accountId", "providerId", "userId", password)
      values (${randomUUID()}, ${uid}, 'credential', ${uid}, ${await hashPassword("senha-segura-123")})`;
    const [{ id: tid }] = await sql`insert into tenants (name) values ('Estúdio Senha') returning id`;
    await sql`insert into memberships (user_id, tenant_id, tour_done_at) values (${uid}, ${tid}, now())`;
    await sql.end();
  });

  test("erra a senha e entra de novo", async ({ page }) => {
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
