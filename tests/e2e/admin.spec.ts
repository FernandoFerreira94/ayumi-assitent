import AxeBuilder from "@axe-core/playwright";
import { createHmac, randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import postgres from "postgres";
import { expect, test } from "./fixtures";

// O servidor de teste sobe com ADMIN_USER_IDS=e2e-admin (playwright.config.ts).
const ADMIN = "e2e-admin";
// Todos os testes mexem no mesmo usuário admin (o id fica fixo no ambiente): um de cada vez.
test.describe.configure({ mode: "serial" });

/** Troca o cookie do contexto por uma sessão do admin, no estado pedido (2FA ligado? já confirmou o código?). */
async function loginAsAdmin(context: BrowserContext, opts: { twoFactor: boolean; stepUp: boolean }) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const token = randomUUID().replace(/-/g, "");
  const sid = randomUUID();
  await sql`insert into "user" (id, name, email, "emailVerified", "twoFactorEnabled")
            values (${ADMIN}, 'Dono', 'dono@e2e.test', true, ${opts.twoFactor})
            on conflict (id) do update set "twoFactorEnabled" = excluded."twoFactorEnabled"`;
  await sql`insert into session (id, "expiresAt", token, "userId") values (${sid}, now() + interval '1 day', ${token}, ${ADMIN})`;
  if (opts.stepUp) await sql`insert into admin_step_up (session_id, user_id) values (${sid}, ${ADMIN})`;
  await sql.end();
  const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64");
  await context.clearCookies();
  await context.addCookies([
    { name: "better-auth.session_token", value: encodeURIComponent(`${token}.${sig}`), domain: "localhost", path: "/" },
  ]);
}

test("quem não é admin vê 404 em todo o painel", async ({ page }) => {
  for (const path of ["/admin", "/admin/verificar", "/admin/ativar-2fa", "/admin/seguranca"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Não encontramos isto" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Painel do dono" })).toHaveCount(0);
  }
});

test("sem login, /admin responde 404 (não manda para o login)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const res = await (await ctx.newPage()).goto("/admin");
  expect(res?.status()).toBe(404);
  await ctx.close();
});

test("admin sem 2FA cai na ativação", async ({ page, context }) => {
  await loginAsAdmin(context, { twoFactor: false, stepUp: false });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/ativar-2fa$/);
  await expect(page.getByRole("heading", { name: "Proteja o painel" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("admin com 2FA e sem código confirmado vai para verificar; código errado mostra erro", async ({ page, context }) => {
  await loginAsAdmin(context, { twoFactor: true, stepUp: false });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/verificar$/);
  await expect(page.getByRole("heading", { name: "Confirme que é você" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Código do app autenticador").fill("12");
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Código inválido" })).toBeVisible();
});

test("admin com código confirmado abre o painel, sem cache e fora do Google", async ({ page, context }) => {
  await loginAsAdmin(context, { twoFactor: true, stepUp: true });
  const res = await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  const h = res!.headers();
  expect(h["cache-control"]).toContain("no-store");
  expect(h["x-robots-tag"]).toBe("noindex, nofollow");
  await page.goto("/admin/seguranca");
  await expect(page.getByRole("heading", { name: "Últimos acessos" })).toBeVisible();
  await expect(page.getByText("Abriu a visão geral").first()).toBeVisible();
});
