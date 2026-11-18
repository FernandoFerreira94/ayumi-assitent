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
  // Texto aparece no formulário e no toast: basta o primeiro
  await expect(page.getByText("Este e-mail ainda não está liberado no app.", { exact: false }).first()).toBeVisible();
});

test("login mostra mensagem genérica em outros erros", async ({ page }) => {
  await page.goto("/login?error=oauth_failed");
  await expect(page.getByText("Não foi possível entrar", { exact: false }).first()).toBeVisible();
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
    // Passa pelo /entrar (navegação completa): folga para a máquina carregada
    await expect(page).toHaveURL(/\/agenda/, { timeout: 10_000 });
  });
});

test.describe("sair e entrar de novo", () => {
  const email = `sair@e2e.test`;

  test.beforeAll(async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    await sql`delete from "user" where email = ${email}`;
    const uid = randomUUID();
    await sql`insert into "user" (id, name, email, "emailVerified") values (${uid}, 'Yumi', ${email}, true)`;
    await sql`insert into account (id, "accountId", "providerId", "userId", password)
      values (${randomUUID()}, ${uid}, 'credential', ${uid}, ${await hashPassword("senha-segura-123")})`;
    const [{ id: tid }] = await sql`insert into tenants (name) values ('Estúdio Sair') returning id`;
    await sql`insert into memberships (user_id, tenant_id, tour_done_at) values (${uid}, ${tid}, now())`;
    await sql.end();
  });

  async function entrar(page: import("@playwright/test").Page) {
    await page.getByRole("button", { name: "Continuar com e-mail" }).click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura-123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    // Passa pelo /entrar (navegação completa): folga para a máquina carregada
    await expect(page).toHaveURL(/\/agenda/, { timeout: 10_000 });
  }

  // Bug: sair com o menu aberto deixava o <dialog> modal vivo na tela escondida e o login não respondia ao toque
  test("sai pelo menu e entra com outra conta sem fechar o app", async ({ page }) => {
    // IP próprio: o limite de login por IP (3 a cada 10 s) não pode somar os logins dos outros testes
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
    await page.goto("/login");
    await entrar(page);
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Que bom te ver!" })).toBeVisible();
    // Nenhum diálogo modal sobrando por trás do login
    await expect.poll(() => page.evaluate(() => document.querySelectorAll("dialog:modal").length)).toBe(0);
    await entrar(page);
  });
});

test.describe("esqueci a senha", () => {
  // Cada teste com um IP próprio: o limite por IP (3 pedidos de link a cada 10 min) não vaza entre testes e retries
  test.beforeEach(async ({ page }) => {
    const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
  });

  test("e-mail que não existe recebe a mesma resposta", async ({ page }) => {
    await page.goto("/login?esqueci=1");
    await page.getByLabel("E-mail da conta").fill("ninguem@e2e.test");
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
  });

  test("pede o link, cria a senha nova e já entra; o link não vale de novo", async ({ page }) => {
    // Conta só do Google (sem senha), própria deste teste: o link cria a senha e já entra
    const email = `esqueci-${randomUUID()}@e2e.test`;
    const db = postgres(process.env.DATABASE_URL!, { max: 1 });
    const uid = randomUUID();
    await db`insert into "user" (id, name, email, "emailVerified") values (${uid}, 'Yumi', ${email}, true)`;
    const [{ id: tid }] = await db`insert into tenants (name) values ('Estúdio Esqueci') returning id`;
    await db`insert into memberships (user_id, tenant_id, tour_done_at) values (${uid}, ${tid}, now())`;
    await db.end();

    await page.goto("/login");
    await page.getByRole("button", { name: "Continuar com e-mail" }).click();
    await page.getByRole("button", { name: "Esqueci minha senha" }).click();
    await page.getByLabel("E-mail da conta").fill(email);
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();

    // O token que iria no e-mail
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const [row] = await sql`select v.identifier from verification v join "user" u on u.id = v.value
      where u.email = ${email} and v.identifier like 'reset-password:%' order by v."createdAt" desc limit 1`;
    await sql.end();
    const token = String(row.identifier).slice("reset-password:".length);
    const link = `/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent("/redefinir-senha")}`;

    await page.goto(link);
    await expect(page).toHaveURL(/\/redefinir-senha\?token=/);
    await page.getByLabel("Nova senha").fill("nova-senha-forte-1");
    await page.getByLabel("Repita a senha").fill("outra-coisa");
    await page.getByRole("button", { name: "Salvar e entrar" }).click();
    await expect(page.getByText("As duas senhas não são iguais.")).toBeVisible();

    await page.getByLabel("Nova senha").fill("nova-senha-forte-1");
    await page.getByLabel("Repita a senha").fill("nova-senha-forte-1");
    await page.getByRole("button", { name: "Salvar e entrar" }).click();
    await expect(page).toHaveURL(/\/agenda/);

    // Uso único: o mesmo link agora cai em "Link expirado"
    await page.context().clearCookies();
    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Link expirado" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pedir um novo link" })).toBeVisible();
  });
});
