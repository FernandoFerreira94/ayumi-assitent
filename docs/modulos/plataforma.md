# Plataforma (auth, estúdio/RLS, banco, worker, deploy)

**Finalidade:** o que todo módulo usa: sessão, estúdio da pessoa, isolamento de dados, migrations, processo do worker, erros, datas, log, backup e deploy.

## Arquivos
- Auth: `lib/auth.ts` (Better Auth, Google + e-mail/senha), `lib/auth-client.ts`, `lib/allowed-emails.ts` (lista vazia = ninguém entra), `lib/session.ts` (`requireSession`), `src/proxy.ts`, `app/api/auth/[...all]`, `app/login`.
- Estúdio: `lib/tenant.ts` (`requireTenant` via `memberships`), `db/client.ts` (`withTenant`: `set_config('app.tenant_id')` + `set local role app_user`).
- Banco: `db/schema.ts` (Drizzle), `db/migrations/*.sql` (aplicadas por `scripts/migrate.mjs` em ordem, tabela `_migrations`).
- Worker: `src/worker/index.ts` (pg-boss; filas de lembretes e de avisos a cada 5 min).
- Base: `lib/errors.ts` (catálogo pt-BR), `lib/dates.ts` (UTC-3 fixo), `lib/money.ts`, `lib/phone.ts`, `lib/time-grid.ts`, `lib/log.ts` (JSON, sem dado pessoal), `lib/useKeyboardInset.ts`, `lib/groupByLetter.ts`, `lib/backup.ts` + `scripts/backup.ts`, `lib/startup-images.ts`, `lib/update-check.ts`.
- API: `api/health` (healthcheck Railway), `api/version`, `api/whatsapp/webhook`.

## Tabelas (todas com `tenant_id` e RLS para `app_user`)
`tenants`, `memberships`, `clients`, `services`, `service_categories`, `appointments`, `appointment_services`, `blocks`, `working_hours`, `slot_lists`, `messages`, `expenses`, `push_subscriptions`, `owner_notices` + tabelas do Better Auth.

## Cuidados
- Tabela nova: `tenant_id` + `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` (ver `0001_init.sql`); teste em `tests/db/tenancy.test.ts`.
- Migration nova: próximo número livre (`0029_...` em 12/11; existem dois `0026`). Web roda `pnpm db:migrate` no start.
- Deploy Railway: web `ayumi-assitent` e worker `distinguished-acceptance`; Redeploy é clicado pelo Fernando.
- `.env.local` = banco de produção.
