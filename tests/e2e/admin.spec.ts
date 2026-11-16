import AxeBuilder from "@axe-core/playwright";
import { createHmac, randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import postgres from "postgres";
import { CURRENT_VERSION, SEEN_VERSION_KEY } from "../../src/features/update/changelog";
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
  for (const path of ["/admin", "/admin/verificar", "/admin/ativar-2fa", "/admin/seguranca", "/admin/assinantes", "/admin/pagamentos", "/admin/uso", "/admin/suporte", "/admin/avisos"]) {
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

test("telas do painel: visão geral, assinantes (com detalhe), pagamentos e CSV", async ({ page, context }) => {
  await loginAsAdmin(context, { twoFactor: true, stepUp: true });

  await page.goto("/admin");
  await expect(page.getByText("Dados de exemplo.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "MRR em 12 meses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Em atraso", level: 2 })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/admin/assinantes");
  await expect(page.getByRole("heading", { name: "Assinantes" })).toBeVisible();
  await page.getByRole("tab", { name: /Em atraso/ }).click();
  await expect(page.getByText("3 salões")).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar salão ou dona" }).fill("violeta");
  await expect(page.getByText("1 salão")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: /Studio Violeta/ }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/salao=demo-08/);
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Studio Violeta" })).toBeVisible();
  await expect(sheet.getByText("Pagamentos recentes")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/admin\/assinantes$/);

  await page.goto("/admin/pagamentos?mes=lixo");
  await expect(page.getByRole("heading", { name: "Pagamentos", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Mês anterior/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const res = await page.request.get("/admin/pagamentos/export?mes=2026-10");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain('filename="bubbly-pagamentos-2026-10.csv"');
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(await res.text()).toMatch(/^﻿Data;Salão;Plano;Método;Status;Valor;Taxa;Líquido;Id MP\r\n/);

  await page.goto("/admin/uso");
  await expect(page.getByRole("heading", { name: "Uso", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Por salão" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/admin/seguranca");
  await expect(page.getByRole("heading", { name: "Aparelhos conectados" })).toBeVisible();
  await page.getByRole("button", { name: "Gerar novos códigos de recuperação" }).click();
  await expect(page.getByLabel("Código do app autenticador")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.getByText("Exportou pagamentos").first()).toBeVisible();
  await expect(page.getByText("Abriu um salão").first()).toBeVisible();
});

test("sem código confirmado, o CSV não sai", async ({ page, context }) => {
  await loginAsAdmin(context, { twoFactor: true, stepUp: false });
  const res = await page.request.get("/admin/pagamentos/export?mes=2026-10", { maxRedirects: 0 });
  expect(res.status()).not.toBe(200);
  expect(await res.text()).not.toContain("Salão;Plano");
});

test("suporte: o salão escreve, o dono responde e o salão vê a resposta no Painel", async ({ page, context, browser }) => {
  test.setTimeout(90_000);
  // Salão (outro contexto, celular) manda a mensagem
  const salon = await browser.newContext({ viewport: { width: 393, height: 660 }, isMobile: true, hasTouch: true });
  const sp = await salon.newPage();
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const uid = randomUUID();
  const token = randomUUID().replace(/-/g, "");
  await sql`insert into "user" (id, name, email, "emailVerified") values (${uid}, 'Ana', ${uid + "@e2e.test"}, true)`;
  await sql`insert into session (id, "expiresAt", token, "userId") values (${randomUUID()}, now() + interval '1 day', ${token}, ${uid})`;
  const salonName = `Salão Suporte ${uid.slice(0, 6)}`;
  const [{ id: tid }] = await sql`insert into tenants (name) values (${salonName}) returning id`;
  await sql`insert into memberships (user_id, tenant_id, tour_done_at) values (${uid}, ${tid}, now())`;
  await sql.end();
  const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64");
  // Sem o diálogo "App atualizado" por cima do Painel (como na fixture)
  await salon.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
    [SEEN_VERSION_KEY, CURRENT_VERSION] as const,
  );
  await salon.addCookies([{ name: "better-auth.session_token", value: encodeURIComponent(`${token}.${sig}`), domain: "localhost", path: "/" }]);

  await sp.goto("/ajustes/suporte");
  await expect(sp.getByRole("heading", { level: 1, name: "Ajuda e suporte" })).toBeVisible();
  expect((await new AxeBuilder({ page: sp }).analyze()).violations).toEqual([]);
  await sp.getByLabel("Mensagem para o suporte").fill("Os lembretes não saíram hoje");
  await sp.getByRole("button", { name: "Enviar" }).click();
  await expect(sp.getByText("Os lembretes não saíram hoje")).toBeVisible();
  await expect(sp.getByText("Enviando…")).toHaveCount(0);

  // Dono vê a conversa esperando, abre e responde
  await loginAsAdmin(context, { twoFactor: true, stepUp: true });
  await page.goto("/admin/suporte");
  await expect(page.getByRole("heading", { name: "Suporte", level: 1 })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: new RegExp(salonName) }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Os lembretes não saíram hoje")).toBeVisible();
  await sheet.getByLabel(`Resposta para ${salonName}`).fill("Já conferi: o WhatsApp estava desconectado.");
  await sheet.getByRole("button", { name: "Enviar" }).click();
  await expect(sheet.getByText("Já conferi: o WhatsApp estava desconectado.")).toBeVisible();
  await expect(sheet.getByText("Enviando…")).toHaveCount(0);

  // Salão: cartão no Painel e selo em Ajustes; ao abrir, zera
  await sp.goto("/agenda");
  await expect(sp.getByRole("link", { name: /O suporte respondeu/ })).toBeVisible();
  await sp.goto("/ajustes");
  await expect(sp.getByText("1 nova")).toBeVisible();
  await sp.getByRole("link", { name: /^Ajuda e suporte/ }).click();
  await expect(sp.getByText("Já conferi: o WhatsApp estava desconectado.")).toBeVisible();
  await expect.poll(async () => {
    await sp.goto("/agenda");
    return sp.getByRole("link", { name: /O suporte respondeu/ }).count();
  }).toBe(0);

  // Aviso do dono: publica, aparece no Painel, o salão fecha; o dono encerra
  await page.goto("/admin/avisos");
  await expect(page.getByRole("heading", { name: "Novo aviso" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const title = `Manutenção ${uid.slice(0, 6)}`;
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Texto").fill("O app fica fora do ar das 23h às 23h30.");
  await page.getByRole("button", { name: "Publicar para todos" }).click();
  await expect(page.getByRole("button", { name: `Encerrar aviso: ${title}` })).toBeVisible();

  await sp.goto("/agenda");
  const card = sp.getByRole("region", { name: `Aviso do Bubbly: ${title}` });
  await expect(card).toBeVisible();
  // Só o cartão (a faixa da semana do Painel tem a sua própria checagem)
  expect((await new AxeBuilder({ page: sp }).include('section[aria-label^="Aviso do Bubbly"]').analyze()).violations).toEqual([]);
  await card.getByRole("button", { name: `Fechar aviso: ${title}` }).click();
  await expect(card).toHaveCount(0);
  await sp.reload();
  await expect(sp.getByRole("region", { name: `Aviso do Bubbly: ${title}` })).toHaveCount(0);

  await page.getByRole("button", { name: `Encerrar aviso: ${title}` }).click();
  await expect(page.getByRole("heading", { name: "Encerrados" })).toBeVisible();
  await salon.close();
});
