# Segurança e LGPD para produção · Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fechar os achados críticos, altos e médios de código da auditoria de 13/11/2026 para o Bubbly poder abrir cadastro com segurança e cumprir a LGPD.

**Architecture:** mudanças pequenas e isoladas por task, cada uma com teste. Regra de domínio em arquivo puro testável; actions só validam, pegam o estúdio (`requireTenant`) e chamam o core em `withTenant`. Migrations novas a partir de `0033`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Better Auth 1.7, Drizzle + Postgres (RLS), pg-boss, Evolution API, Web Push, Vitest, Playwright.

**Spec:** `auditoria-seguranca-producao.md` (mesma pasta).

## Global Constraints

- Ler `AGENTS.md` e a ficha do módulo antes de cada task; atualizar a ficha em `docs/modulos/` quando mudar ligação, tabela, job ou regra.
- Erros para a usuária só pelo catálogo `src/lib/errors.ts`; actions devolvem `ok()/fail()`.
- Nunca logar telefone completo, token ou texto de mensagem.
- UI: ação em sheet/diálogo (vaul), ícones de `components/ui/Icon.tsx`, toasts via `notify`, campos ≥16px.
- Testes de banco SÓ em Postgres local de teste (`localhost`, nome terminando em `_test`). Nunca no banco de produção.
- Branch `claude/project-thread-6hxyj5`, worktree `C:\Users\ferna\Desktop\WebCode\Projetos\ayumi-seguranca`. Um PR por bloco (A, B, C).
- Mudou algo que o worker usa: avisar Redeploy de web + worker.

Fora deste plano (planos próprios depois): cobrança/assinatura e limites por plano (Fase 2), domínio + verificação do Google (Fase 3, operação), multiusuário e fuso por salão (Fase 4).

---

## Bloco A · Críticos e proteção de dados (PR 1)

### Task 1: Trava contra rodar testes no banco de produção (C2)

**Files:**
- Create: `tests/db-guard.ts`
- Create: `tests/e2e/global-setup.ts`
- Modify: `tests/setup.ts`, `playwright.config.ts`
- Test: `tests/unit/db-guard.test.ts`

**Interfaces:**
- Produces: `assertTestDatabase(url?: string): void` (lança se a URL não for local de teste).

- [ ] **Step 1: Teste que falha**

```ts
// tests/unit/db-guard.test.ts
import { describe, expect, it } from "vitest";
import { assertTestDatabase } from "../db-guard";

describe("assertTestDatabase", () => {
  it("aceita banco local de teste", () => {
    expect(() => assertTestDatabase("postgres://postgres:postgres@localhost:5432/assist_test")).not.toThrow();
    expect(() => assertTestDatabase("postgres://u:p@127.0.0.1:54331/bubbly_test")).not.toThrow();
  });
  it("sem URL não faz nada (testes de banco são pulados)", () => {
    expect(() => assertTestDatabase(undefined)).not.toThrow();
  });
  it("recusa host remoto", () => {
    expect(() => assertTestDatabase("postgres://u:p@monorail.proxy.rlwy.net:5432/railway_test")).toThrow(/produção/);
  });
  it("recusa banco local sem _test", () => {
    expect(() => assertTestDatabase("postgres://u:p@localhost:5432/railway")).toThrow(/_test/);
  });
});
```

- [ ] **Step 2:** `pnpm vitest run tests/unit/db-guard.test.ts` → FAIL (módulo não existe).

- [ ] **Step 3: Implementação**

```ts
// tests/db-guard.ts
const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Testes de banco apagam tabelas inteiras: só rodam em Postgres local cujo nome termina em _test. */
export function assertTestDatabase(url = process.env.DATABASE_URL): void {
  if (!url) return;
  const u = new URL(url);
  if (!LOCAL.has(u.hostname))
    throw new Error(`DATABASE_URL aponta para ${u.hostname}: testes não rodam fora do localhost (risco de apagar produção).`);
  if (!/_test$/.test(u.pathname.replace(/^\//, "")))
    throw new Error("O banco de teste precisa terminar em _test (ex.: assist_test).");
}
```

```ts
// tests/setup.ts (acrescentar no topo)
import { assertTestDatabase } from "./db-guard";
assertTestDatabase();
```

```ts
// tests/e2e/global-setup.ts
import { assertTestDatabase } from "../db-guard";
export default function globalSetup() {
  if (!process.env.DATABASE_URL) throw new Error("e2e precisa de DATABASE_URL de um Postgres local _test");
  assertTestDatabase();
}
```

`playwright.config.ts`: `globalSetup: "./tests/e2e/global-setup.ts"` e no `webServer.env` acrescentar `DATABASE_URL: process.env.DATABASE_URL ?? ""` (variável do processo vence o `.env.local`, então o servidor de teste usa o mesmo banco de teste).

- [ ] **Step 4:** `pnpm vitest run tests/unit/db-guard.test.ts` → PASS. Rodar a suíte com `DATABASE_URL=postgres://postgres:postgres@localhost:54331/assist_test` (Docker `postgres:16` local) → tudo verde.
- [ ] **Step 5:** Commit `test: trava testes de banco fora do Postgres local de teste`.
- [ ] **Step 6:** Atualizar `AGENTS.md` (Git e ambiente): como subir o Postgres de teste local e que a trava existe.

### Task 2: Remover o fallback `EVOLUTION_INSTANCE` (C1)

Usuário confirmou que a variável não existe no Railway; remover mesmo assim para não voltar.

**Files:**
- Modify: `src/features/reminders/run.ts:16-26`, `src/worker/index.ts:34-38`, `src/features/messaging/actions.ts:31-33`, `src/features/messaging/booking-send.ts:33-35`, `src/features/messaging/evolution.ts:37-42` (apagar `messagingFromEnv` se não houver mais uso)
- Test: `tests/db/nudge.test.ts` ou novo `tests/unit/reminders-run.test.ts`

**Interfaces:**
- Produces: `runReminders(portFor, now?, push?)` (sem `fallbackInstance`).

- [ ] **Step 1: Teste** — `runReminders` com dois estúdios, um com `whatsapp_instance = null`: `portFor` só é chamado com a instância do outro.

```ts
const calls: string[] = [];
await runReminders((i) => { calls.push(i); return fakePort; }, now, null);
expect(calls).toEqual(["studio-a"]);
```

- [ ] **Step 2:** rodar → FAIL (assinatura antiga).
- [ ] **Step 3:** em `run.ts` trocar `const instance = t.instance ?? fallbackInstance;` por `const instance = t.instance;` e remover o parâmetro; no worker remover `process.env.EVOLUTION_INSTANCE`; em `actions.ts` e `booking-send.ts` usar só `t?.i` / `t?.instance` (sem instância = `fail("WHATSAPP_UNAVAILABLE")` / `"skipped"`). `grep -rn EVOLUTION_INSTANCE src` deve voltar vazio.
- [ ] **Step 4:** testes → PASS. Commit `fix: estúdio sem WhatsApp próprio nunca usa a instância do ambiente`.

### Task 3: Webhook do WhatsApp com token por instância (A4)

**Files:**
- Modify: `src/features/messaging/webhook-url.ts`, `src/app/api/whatsapp/webhook/route.ts`, `src/features/whatsapp/webhook.ts`, `src/worker/index.ts`
- Test: `tests/unit/webhook-url.test.ts`

**Interfaces:**
- Produces: `webhookUrl(instance: string, env?): string | null`, `isValidWebhookToken(given: string | null, instance: string, env?): boolean`, `isLegacyWebhookToken(given, env?)`.

- [ ] **Step 1: Teste**

```ts
const env = { BETTER_AUTH_SECRET: "s".repeat(40), BETTER_AUTH_URL: "https://app.test" } as NodeJS.ProcessEnv;
const url = new URL(webhookUrl("studio-a", env)!);
const t = url.searchParams.get("token");
expect(isValidWebhookToken(t, "studio-a", env)).toBe(true);
expect(isValidWebhookToken(t, "studio-b", env)).toBe(false); // token de um salão não serve para outro
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementação**

```ts
function token(instance: string, env = process.env): string | null {
  const secret = env.BETTER_AUTH_SECRET;
  return secret ? createHmac("sha256", secret).update(`whatsapp-webhook:${instance}`).digest("hex").slice(0, 40) : null;
}
export function webhookUrl(instance: string, env = process.env): string | null {
  const base = env.BETTER_AUTH_URL?.replace(/\/$/, "");
  const t = token(instance, env);
  return base && t ? `${base}/api/whatsapp/webhook?token=${t}` : null;
}
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function isValidWebhookToken(given: string | null, instance: string, env = process.env): boolean {
  const t = token(instance, env);
  return !!t && !!given && same(given, t);
}
/** Token antigo (um só para todos). Aceito só até cada instância receber a URL nova; depois remover. */
export function isLegacyWebhookToken(given: string | null, env = process.env): boolean {
  const s = env.BETTER_AUTH_SECRET;
  if (!s || !given) return false;
  return same(given, createHmac("sha256", s).update("whatsapp-webhook").digest("hex").slice(0, 40));
}
```

Rota: ler o corpo primeiro, `parseUpsert`, e então `if (!isValidWebhookToken(token, msg.instance) && !isLegacyWebhookToken(token)) return 401` (logar `whatsapp_webhook_legacy` quando for o antigo). Sem `msg` válido: 200 ignorado só se o token for válido para alguma regra (legacy) ou se o corpo trouxer `instance` com token correto; senão 401.
`ensureWebhook(admin, instance)` passa `webhookUrl(instance)`. No `worker/index.ts`, ao iniciar, percorrer `tenants` com `whatsapp_instance` e chamar `ensureWebhook` (migra todas as instâncias sem a dona abrir Ajustes).

- [ ] **Step 4:** PASS + `tests/db/whatsapp-inbound.test.ts` verde. Commit `fix: webhook do WhatsApp com segredo por instância`.
- [ ] **Step 5:** Ficha `docs/modulos/whatsapp.md`: novo formato do segredo e prazo para remover o legado (próximo PR após 1 deploy do worker).

### Task 4: Endpoint de push só em servidores de push conhecidos (M1)

**Files:** Modify `src/features/push/schema.ts`; Test `tests/unit/push-schema.test.ts`

- [ ] **Step 1: Teste**

```ts
const ok = { keys: { p256dh: "x", auth: "y" } };
expect(subscriptionSchema.safeParse({ ...ok, endpoint: "https://web.push.apple.com/abc" }).success).toBe(true);
expect(subscriptionSchema.safeParse({ ...ok, endpoint: "https://fcm.googleapis.com/fcm/send/abc" }).success).toBe(true);
expect(subscriptionSchema.safeParse({ ...ok, endpoint: "http://evolution.railway.internal:8080/x" }).success).toBe(false);
expect(subscriptionSchema.safeParse({ ...ok, endpoint: "https://169.254.169.254/latest" }).success).toBe(false);
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:**

```ts
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];
export const isPushEndpoint = (raw: string) => {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && PUSH_HOSTS.some((r) => r.test(u.hostname));
  } catch { return false; }
};
export const subscriptionSchema = z.object({
  endpoint: z.url().max(2048).refine(isPushEndpoint),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
});
```

- [ ] **Step 4:** PASS. Commit `fix: push só para servidores de notificação conhecidos`.

### Task 5: Cabeçalhos de segurança (A5)

**Files:** Modify `next.config.ts`; Test `tests/e2e/health.spec.ts` (acrescentar checagem)

- [ ] **Step 1: Teste e2e**

```ts
test("respostas trazem cabeçalhos de segurança", async ({ request }) => {
  const r = await request.get("/login");
  expect(r.headers()["x-frame-options"]).toBe("DENY");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  expect(r.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(r.headers()["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** em `next.config.ts`:

```ts
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://api.bigdatacloud.net https://api.open-meteo.com https://geocoding-api.open-meteo.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      // 1ª semana só relatório; depois trocar a chave para Content-Security-Policy
      { key: "Content-Security-Policy-Report-Only", value: CSP },
    ],
  }];
},
```

- [ ] **Step 4:** PASS; abrir o app local e conferir console sem violações nas telas principais (login, agenda, ajustes, conversa). Commit `feat: cabeçalhos de segurança`.

### Task 6: Google — revogar ao desconectar e tokens criptografados (A2, M2)

**Files:**
- Create: `src/features/google/token-crypto.ts`
- Modify: `src/lib/auth.ts`, `src/features/google/server.ts:24-50`, `src/features/google/actions.ts:16-35`, `src/features/google/calendar.ts` (função `revokeToken`)
- Test: `tests/unit/google-token-crypto.test.ts`

**Interfaces:**
- Produces: `readToken(stored: string | null): Promise<string | null>`, `writeToken(plain: string): Promise<string>`, `revokeToken(token: string, fetchImpl?): Promise<void>`.

- [ ] **Step 0:** conferir em `node_modules/better-auth` que `account.encryptOAuthTokens` existe na 1.7 e como cifra (`symmetricEncrypt`/`symmetricDecrypt` de `better-auth/crypto`, chave = `BETTER_AUTH_SECRET`). Se a API for outra, adaptar `token-crypto.ts` a ela.
- [ ] **Step 1: Teste**

```ts
process.env.BETTER_AUTH_SECRET = "s".repeat(40);
const enc = await writeToken("ya29.token");
expect(enc).not.toContain("ya29");
expect(await readToken(enc)).toBe("ya29.token");
expect(await readToken("ya29.legado-em-texto")).toBe("ya29.legado-em-texto"); // linhas antigas continuam
expect(await readToken(null)).toBeNull();
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:**

```ts
import "server-only";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
const key = () => process.env.BETTER_AUTH_SECRET ?? "";
/** Tokens do Google no banco: cifrados pelo Better Auth (encryptOAuthTokens). Linha antiga em texto puro ainda funciona. */
export async function readToken(stored: string | null): Promise<string | null> {
  if (!stored) return null;
  if (/^ya29\.|^1\/\//.test(stored)) return stored; // formato do Google = texto puro legado
  try { return await symmetricDecrypt({ key: key(), data: stored }); } catch { return stored; }
}
export const writeToken = (plain: string) => symmetricEncrypt({ key: key(), data: plain });
```

`auth.ts`: `account: { encryptOAuthTokens: true, accountLinking: { allowDifferentEmails: true } }`.
`server.ts`: `ownerGoogleAccount` devolve tokens passados por `readToken`; o `update account set "accessToken"` grava `await writeToken(fresh.accessToken)`.
`calendar.ts`: `revokeToken(token)` = `POST https://oauth2.googleapis.com/revoke?token=<token>` (ignora erro 400 de token já inválido).
`actions.disconnectGoogle`: antes do `delete`, ler o refresh token, `await revokeToken(...).catch(() => {})`.

- [ ] **Step 4:** PASS + `tests/unit/google-calendar.test.ts` verde. Teste manual: conectar Google, criar agendamento (evento aparece), conferir no banco que `accessToken` não começa com `ya29`. Commit `fix: tokens do Google cifrados e revogados ao desconectar`.

### Task 7: Fechar cadastro por senha (A1, versão sem provedor de e-mail)

Cadastro novo só pelo Google (e-mail verificado pelo Google). Senha continua para quem já tem e para quem cria pelo aviso do Google (`setPassword`). "Esqueci a senha" e cadastro por e-mail voltam quando houver e-mail transacional (Fase 2).

**Files:** Modify `src/lib/auth.ts:14`, `src/app/login/LoginForm.tsx` (remover view `signup` e o botão "Criar conta com e-mail"), `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Teste e2e** (substitui os dois testes de cadastro):

```ts
test("não existe cadastro por e-mail", async ({ page, request }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Criar conta com e-mail" })).toHaveCount(0);
  const r = await request.post("/api/auth/sign-up/email", { data: { name: "X", email: "novo@e2e.test", password: "senha-segura-123" } });
  expect(r.ok()).toBe(false);
});
```

Manter o teste "erra a senha e entra de novo" criando o usuário com senha pela fixture (insert em `user` + `account` com `providerId='credential'` e hash via `better-auth/crypto` `hashPassword`).

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** `emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 }` (sem `autoSignIn`). Remover a view/strings de signup do `LoginForm`.
- [ ] **Step 4:** `pnpm test:e2e tests/e2e/auth.spec.ts` → PASS (conserta também o spec quebrado desde o #111). Commit `fix: cadastro novo só pelo Google`.

## Bloco B · LGPD (PR 2)

### Task 8: Excluir cliente com histórico = anonimizar (A3)

**Files:**
- Create: `src/db/migrations/0033_client_anonymize.sql`
- Modify: `src/db/schema.ts` (clients.anonymizedAt), `src/features/clients/core.ts:58-67`, listagens de clientes (filtrar `anonymized_at is null`), textos do diálogo de excluir
- Test: `tests/db/clients-delete.test.ts`

- [ ] **Step 1: Migration**

```sql
ALTER TABLE clients ADD COLUMN anonymized_at timestamptz;
```

- [ ] **Step 2: Teste (Postgres local)** — cliente com agendamento: `deleteClientRow` devolve ok; a linha fica com `name = 'Cliente removida'`, `phone_e164` começando com `anon:`, `email`/`notes` nulos, `anonymized_at` preenchido; `messages` da cliente apagadas; agendamentos mantidos (financeiro não muda). Cliente sem agendamento continua sendo apagada de verdade.
- [ ] **Step 3:**

```ts
export async function deleteClientRow(tx: Tx, id: string): Promise<ActionResult> {
  const [used] = await tx.select({ id: appointments.id }).from(appointments).where(eq(appointments.clientId, id)).limit(1);
  if (!used) {
    await tx.delete(clients).where(eq(clients.id, id));
    return ok();
  }
  // LGPD: some com os dados pessoais e mantém o histórico financeiro do salão
  await tx.delete(messages).where(eq(messages.clientId, id));
  await tx.update(clients).set({
    name: "Cliente removida", phoneE164: `anon:${id}`, email: null, notes: null, anonymizedAt: new Date(),
  }).where(eq(clients.id, id));
  return ok();
}
```

Lembretes/inbound nunca acham `anon:` (não é E.164). Listas e seletor de clientes filtram `anonymizedAt is null`. Diálogo de excluir: "Os dados dela somem. Os atendimentos antigos ficam como 'Cliente removida' no financeiro."
- [ ] **Step 4:** PASS. Remover `CLIENT_HAS_APPOINTMENTS` do catálogo se ficar sem uso. Commit. Atualizar `docs/modulos/clientes.md`.

### Task 9: Excluir minha conta (A3)

**Files:**
- Create: `src/features/salon/delete-account.ts` (core), `src/features/salon/DeleteAccountSheet.tsx`
- Modify: `src/features/salon/actions.ts` (action `deleteAccount`), `src/features/messaging/evolution-admin.ts` (método `remove(instance)` = `DELETE /instance/delete/{instance}`), tela `perfil`
- Test: `tests/db/delete-account.test.ts`, `tests/unit/evolution.test.ts`

- [ ] **Step 1: Teste (Postgres local)** — `deleteAccountData(userId, deps)` com dois estúdios: apaga `tenants` do dono (cascata leva clientes, agendamentos, mensagens, push…), apaga `user` (cascata em `session`/`account`/`memberships`), chama `deps.revokeGoogle` e `deps.removeInstance("studio-x")`; o outro estúdio fica intacto.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:**

```ts
export type DeleteDeps = { revokeGoogle: (userId: string) => Promise<void>; removeInstance: (i: string) => Promise<void> };
export async function deleteAccountData(userId: string, deps: DeleteDeps) {
  const db = getDb();
  const owned = await db.execute<{ id: string; instance: string | null }>(sql`
    select t.id, t.whatsapp_instance as instance from tenants t
    join memberships m on m.tenant_id = t.id where m.user_id = ${userId} and m.role = 'owner'`);
  await deps.revokeGoogle(userId).catch(() => {});
  for (const t of owned) if (t.instance) await deps.removeInstance(t.instance).catch(() => {});
  await db.transaction(async (tx) => {
    for (const t of owned) await tx.execute(sql`delete from tenants where id = ${t.id}`);
    await tx.execute(sql`delete from "user" where id = ${userId}`);
  });
}
```

Action `deleteAccount(confirm: string)`: `requireTenant`, exige `confirm === "EXCLUIR"`, chama o core, `auth.api.signOut`, devolve ok; a folha redireciona para `/login?conta=excluida`. Sheet em Meu perfil (rodapé, texto vermelho), campo para digitar EXCLUIR, botão desabilitado até bater.
Conferir em `0002_auth.sql` se `session`, `account`, `memberships` têm `ON DELETE CASCADE` para `user`; se não, migration `0034_user_cascade.sql` acrescentando.
- [ ] **Step 4:** PASS + e2e curto em `tests/e2e/perfil.spec.ts` (abre a folha, botão bloqueado até digitar). Commit. Atualizar `docs/modulos/perfil-ajustes.md` e `plataforma.md`.

### Task 10: Baixar meus dados (portabilidade)

**Files:** Create `src/features/salon/export.ts` (core puro que monta CSV), action `exportMyData` em `salon/actions.ts`, botão em Meu perfil; Test `tests/unit/export-csv.test.ts`

- [ ] **Step 1: Teste** — `toCsv([{ nome: 'Ana; "Bia"', telefone: "+5511…" }])` escapa aspas e `;`, começa com BOM `\uFEFF` (Excel BR), separador `;`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** `toCsv(rows)` + action devolve `{ clientes, agendamentos, despesas }` como 3 strings CSV (só do estúdio, via `withTenant`); o cliente baixa com `Blob` (3 arquivos ou um `.zip` só se já houver lib; preferir 3 downloads).
- [ ] **Step 4:** PASS. Commit.

### Task 11: Registro de acesso por 6 meses e retenção de mensagens (M4, M5)

**Files:**
- Create: `src/db/migrations/0035_access_log.sql`, `src/features/retention/run.ts`
- Modify: `src/lib/auth.ts` (hook `session.create.after`), `src/worker/index.ts` (fila diária `retention`)
- Test: `tests/db/retention.test.ts`

- [ ] **Step 1: Migration**

```sql
CREATE TABLE access_log (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX access_log_created ON access_log (created_at);
-- Só o dono do banco lê/escreve (Marco Civil art. 15); app_user não tem acesso.
```

- [ ] **Step 2: Teste** — `runRetention(now)` apaga `access_log` com mais de 200 dias e `messages` com mais de 365 dias; mantém o resto.
- [ ] **Step 3:** hook no Better Auth: `databaseHooks.session.create.after: async (s) => pool.query("insert into access_log (user_id, ip, user_agent) values ($1,$2,$3)", [s.userId, s.ipAddress ?? null, s.userAgent ?? null])`. `runRetention` com `getDb()` (rotina que itera estúdios, permitido). Worker: `boss.schedule("retention", "15 4 * * *")`.
- [ ] **Step 4:** PASS. Commit. Atualizar `plataforma.md` e `whatsapp.md` (retenção de 12 meses).

### Task 12: Política de privacidade fiel ao sistema (M4)

**Files:** Modify `src/app/privacidade/page.tsx`, `src/app/termos/page.tsx`

- [ ] Incluir BigDataCloud (cidade a partir da localização, só se ligar) na seção 5; retenção de mensagens 12 meses; registro de acesso 6 meses (agora real); "Excluir minha conta" e "Baixar meus dados" em Meu perfil (seção de direitos); nos Termos, cláusula de operador (a profissional garante base legal para tratar dados das clientes e avisa que elas recebem mensagens automáticas, respondendo "SAIR" para parar) e aviso de que o WhatsApp é conectado por integração não oficial e pode ser desconectado pelo WhatsApp.
- [ ] Commit `docs: política e termos atualizados`.

## Bloco C · Abuso, custo e observabilidade (PR 3)

### Task 13: Cliente pode pedir para não receber mais mensagens ("SAIR")

**Files:** Create `src/db/migrations/0036_client_opt_out.sql` (`ALTER TABLE clients ADD opted_out_at timestamptz`), Modify `src/features/messaging/replies.ts` (intenção `stop` para "sair", "parar", "pare"), `inbound.ts` (grava `opted_out_at`, responde uma vez "Pronto, você não recebe mais lembretes automáticos."), `reminders/core.ts` + `nudge.ts` + `booking-send.ts` (pulam cliente com `opted_out_at`), cartão da cliente mostra "Não recebe lembretes"; Test `tests/unit/whatsapp-replies.test.ts`, `tests/db/whatsapp-inbound.test.ts`

- [ ] Teste: `parseIntent("SAIR")` = `stop`; inbound grava `opted_out_at` e não chama a IA; `sendReminders` não envia para ela.
- [ ] Implementar, PASS, commit, atualizar `lembretes.md`/`whatsapp.md`.

### Task 14: Cotas por estúdio e texto curto para a IA (M3)

**Files:** Create `src/features/messaging/quota.ts`; Modify `messaging/actions.ts` (`sendClientMessage`), `messaging/classify.ts`; Test `tests/unit/quota.test.ts`, `tests/db/quota.test.ts`

- [ ] Teste: `overDailyLimit(tx, now)` = true quando o estúdio já mandou 150 mensagens `kind='manual'` no dia (fuso do estúdio); `classifyReply` corta o texto em 500 caracteres antes de enviar.
- [ ] `sendClientMessage` → `fail("RATE_LIMITED")` (novo erro no catálogo: "Você enviou muitas mensagens hoje. Tente amanhã.") Os limites ficam em constantes para virarem limite por plano na Fase 2.
- [ ] PASS, commit.

### Task 15: Logs e Sentry sem dado pessoal (B5, B7)

**Files:** Modify `src/app/api/whatsapp/webhook/route.ts:24` e demais `String(e)` em caminhos com dado de cliente (logar `e.name` + `code`/`constraint` do Postgres), `src/instrumentation-client.ts` (`beforeSend` com `redactUrl` e remoção de `?conversa=`/`?aviso=`); Test `tests/unit/redact-url.test.ts`

- [ ] Teste: `redactUrl("/agenda?conversa=123")` → `/agenda?conversa=[redacted]`.
- [ ] Implementar `errCode(e)` em `src/lib/log.ts` (`{ err: e.name, code: e.code, constraint: e.constraint }`) e usar nos logs do webhook/inbound/reminders.
- [ ] PASS, commit.

---

## Ordem e entrega

1. **PR 1 (Bloco A, tasks 1–7)**: merge após CI verde; Redeploy web + worker (task 2 e 3 mexem no worker).
2. **PR 2 (Bloco B, tasks 8–12)**: migrations 0033–0035; Redeploy web + worker.
3. **PR 3 (Bloco C, tasks 13–15)**: migration 0036; Redeploy web + worker.
4. Depois de 1 semana sem violações: trocar CSP para enforce e remover token legado do webhook.

## Self-review

- Cobertura da auditoria: C1 T2 · C2 T1 · A1 T7 · A2 T6 · A3 T8–T10 · A4 T3 · A5 T5 · M1 T4 · M2 T6 · M3 T14 · M4 T11–T12 · M5 T11 · M8 T7 (auth.spec) · B5/B7 T15. Fora: M6 (Fase 3), M7/B1–B3 (Fase 4), M9 backup (operação: configurar cron e testar restore, checklist à parte), cobrança (Fase 2).
- Nomes consistentes: `assertTestDatabase`, `webhookUrl(instance)`, `isValidWebhookToken(given, instance)`, `readToken/writeToken`, `deleteAccountData`, `runRetention`.
