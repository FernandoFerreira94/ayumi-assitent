# Plataforma (auth, estúdio/RLS, banco, worker, deploy)

**Finalidade:** o que todo módulo usa: sessão, estúdio da pessoa, isolamento de dados, migrations, processo do worker, erros, datas, log, backup e deploy.

## Arquivos
- Auth: `lib/auth.ts` (Better Auth, Google + e-mail/senha), `lib/auth-client.ts`, `lib/allowed-emails.ts` (lista vazia = ninguém entra), `lib/session.ts` (`requireSession`), `src/proxy.ts`, `app/api/auth/[...all]`, `app/login`.
- Estúdio: `lib/tenant.ts` (`requireTenant` via `memberships`), `db/client.ts` (`withTenant`: `set_config('app.tenant_id')` + `set local role app_user`).
- Banco: `db/schema.ts` (Drizzle), `db/migrations/*.sql` (aplicadas por `scripts/migrate.mjs` em ordem, tabela `_migrations`).
- Worker: `src/worker/index.ts` (pg-boss; filas de lembretes e de avisos a cada 5 min; `retention` diária 04:15 BRT via `features/retention/run.ts`: apaga `access_log` > 200 dias e `messages` > 365 dias).
- Base: `lib/errors.ts` (catálogo pt-BR), `lib/dates.ts` (UTC-3 fixo), `lib/money.ts`, `lib/phone.ts`, `lib/time-grid.ts`, `lib/log.ts` (JSON, sem dado pessoal), `components/system/KeyboardWatcher.tsx` (teclado do iPhone para o app todo: vars `--kb`/`--vvh`/`--vv-top` + `data-kb`, usadas no `globals.css`), `lib/groupByLetter.ts`, `lib/backup.ts` + `scripts/backup.ts`, `lib/startup-images.ts`, `lib/update-check.ts`.
- Páginas públicas (sem login, exigidas pelo Google OAuth): `/privacidade` e `/termos` (`features/legal/LegalPage.tsx`), liberadas em `PUBLIC_PATHS` do `proxy.ts`, sem splash; links no rodapé do login. Texto descreve escopos Google, Evolution, Anthropic, Open-Meteo, Sentry, Railway: mexeu em integração/dado, atualize o texto.
- API: `api/health` (healthcheck Railway), `api/version`, `api/whatsapp/webhook`.

- Cadastro barrado: `ALLOWED_EMAILS` (Railway, web) é a lista do piloto; fora dela o `databaseHooks.user.create.before` lança `NOT_ALLOWED`. Na volta do Google, `app/api/auth/[...all]/route.ts` troca o JSON de erro por redirect para `/login?error=CODE`, que mostra texto + toast (`authErrorText`).

## Tabelas (todas com `tenant_id` e RLS para `app_user`)
`tenants`, `memberships`, `clients`, `services`, `service_categories`, `appointments`, `appointment_services`, `blocks`, `working_hours`, `slot_lists`, `messages`, `expenses`, `push_subscriptions`, `owner_notices` + tabelas do Better Auth.

`access_log` (sem tenant, sem GRANT para `app_user`): registro de acesso do Marco Civil, gravado no `databaseHooks.session.create.after` do `auth.ts` (user_id, ip, user_agent). Guardado 6 meses; sobrevive à exclusão da conta.

## Cuidados
- Tabela nova: `tenant_id` + `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` (ver `0001_init.sql`); teste em `tests/db/tenancy.test.ts`.
- Migration nova: próximo número livre (`0029_...` em 12/11; existem dois `0026`). Web roda `pnpm db:migrate` no start.
- Deploy Railway: web `ayumi-assitent` e worker `distinguished-acceptance`; Redeploy é clicado pelo Fernando.
- `.env.local` = banco de produção.
- Logs: em caminhos com dado de cliente use `errCode(e)` (`lib/log.ts`: tipo, código e constraint, sem mensagem), nunca `String(e)`. Sentry do navegador (`instrumentation-client.ts`) passa URL e breadcrumbs por `redactUrl` (token, `conversa`, `aviso`) e não manda texto de clique.
