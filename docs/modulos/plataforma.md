# Plataforma (auth, estúdio/RLS, banco, worker, deploy)

**Finalidade:** o que todo módulo usa: sessão, estúdio da pessoa, isolamento de dados, migrations, processo do worker, erros, datas, log, backup e deploy.

## Arquivos
- Auth: `lib/auth.ts` (Better Auth, Google + e-mail/senha), `lib/auth-client.ts`, `lib/allowed-emails.ts` (lista vazia = ninguém entra), `lib/session.ts` (`requireSession`), `src/proxy.ts`, `app/api/auth/[...all]`, `app/login`.
- Estúdio: `lib/tenant.ts` (`requireTenant` via `memberships`), `db/client.ts` (`withTenant`: `set_config('app.tenant_id')` + `set local role app_user`).
- Banco: `db/schema.ts` (Drizzle), `db/migrations/*.sql` (aplicadas por `scripts/migrate.mjs` em ordem, tabela `_migrations`).
- Worker: `src/worker/index.ts` (pg-boss; `send-reminders` a cada 5 min = 1º/2º aviso, não respondeu e respostas guardadas da noite; `owner-notices` a cada 5 min; `admin-digest` diária 09:00 BRT (resumo ao dono, ver [admin.md](admin.md)); na partida desagenda a fila antiga `push-pendencias` e reaponta o webhook de todas as instâncias; `retention` diária 04:15 BRT via `features/retention/run.ts`: apaga `access_log` > 200 dias, `messages` > 365 dias, `admin_audit_log` > 365 dias e `admin_step_up` > 7 dias).
- Base: `lib/errors.ts` (catálogo pt-BR), `lib/dates.ts` (UTC-3 fixo), `lib/money.ts`, `lib/phone.ts`, `lib/time-grid.ts`, `lib/log.ts` (JSON, sem dado pessoal), `components/system/KeyboardWatcher.tsx` (teclado do iPhone para o app todo: vars `--kb`/`--vvh`/`--vv-top` + `data-kb`, usadas no `globals.css`), `lib/groupByLetter.ts`, `lib/backup.ts` + `scripts/backup.ts`, `lib/startup-images.ts`, `lib/update-check.ts`.
- Páginas públicas (sem login, exigidas pelo Google OAuth): `/privacidade` e `/termos` (`features/legal/LegalPage.tsx`), liberadas em `PUBLIC_PATHS` do `proxy.ts`, sem splash; links no rodapé do login. Texto descreve escopos Google, Evolution, Anthropic, Open-Meteo, Sentry, Railway: mexeu em integração/dado, atualize o texto.
- API: `api/health` (healthcheck Railway), `api/version`, `api/whatsapp/webhook`.

- Esqueci a senha (16/11): no `/login`, "Continuar com e-mail" → "Esqueci minha senha" chama `requestPasswordReset` (resposta igual exista ou não a conta). `sendResetPassword` (auth.ts) manda o e-mail por `lib/email.ts` (API HTTP do Resend, sem SDK; envs `RESEND_API_KEY` e `EMAIL_FROM`) com o texto de `features/auth/emails.ts`. Link vale 30 min, uso único, no máximo 3 por conta a cada 15 min + limite por IP (`rateLimit.customRules`). Abre `/api/auth/reset-password/<token>` → `/redefinir-senha?token=` (pública no `proxy.ts`). Salvar chama `features/auth/actions.ts#resetPasswordAndSignIn`: troca a senha (derruba as outras sessões: `revokeSessionsOnPasswordReset`), e entra com `signInEmail` (conta com 2FA volta para o login). Conta só do Google ganha senha por esse caminho. Cadastro continua só pelo Google (decisão do usuário, 16/11): sem verificação de e-mail própria.
- Cadastro barrado: `ALLOWED_EMAILS` (Railway, web) é a lista do piloto; fora dela o `databaseHooks.user.create.before` lança `NOT_ALLOWED`. Na volta do Google, `app/api/auth/[...all]/route.ts` troca o JSON de erro por redirect para `/login?error=CODE`, que mostra texto + toast (`authErrorText`).

## Tabelas (todas com `tenant_id` e RLS para `app_user`)
`tenants`, `memberships`, `clients`, `services`, `service_categories`, `appointments`, `appointment_services`, `blocks`, `working_hours`, `slot_lists`, `messages`, `expenses`, `push_subscriptions`, `owner_notices`, `support_messages`, `platform_notice_dismissals` + tabelas do Better Auth. Sem tenant: `platform_notices` (só leitura para `app_user`), `access_log`, `admin_step_up`, `admin_audit_log`.

`memberships` ainda **não tem papel** (dona/gerente/profissional) nem há `professionals`/planos na main: isso está na branch local de pagamentos (não mergeada em 17/11).

Painel do dono (`admin_step_up`, `admin_audit_log`, `"twoFactor"`): ver [admin.md](admin.md).

`access_log` (sem tenant, sem GRANT para `app_user`): registro de acesso do Marco Civil, gravado no `databaseHooks.session.create.after` do `auth.ts` (user_id, ip, user_agent). Guardado 6 meses; sobrevive à exclusão da conta.

## Cuidados
- Domínio (16/11): app em `app.bubbly.app.br` (`BETTER_AUTH_URL`). `lib/canonical-host.ts` redireciona páginas do endereço antigo `*.up.railway.app` para ele no `proxy.ts`; `/api` (webhook, calendários, convites) segue respondendo no antigo, então NÃO apagar o domínio do Railway. Rollback: `BETTER_AUTH_URL` de volta ao antigo desliga o redirect. Site de apresentação em `site/` (serviço `bubbly-site`, ver `site/README.md`).
- Tabela nova: `tenant_id` + `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` (ver `0001_init.sql`); teste em `tests/db/tenancy.test.ts`.
- Migration nova: próximo número livre: hoje **0047** (já existem dois `0026` e dois `0029`; 0036–0040 e 0043–0044 estão vagos na main e a branch local de pagamentos usa números nessa faixa, então não reaproveite buracos). Web roda `pnpm db:migrate` no start.
- Deploy Railway: web `ayumi-assitent` e worker `distinguished-acceptance`; Redeploy é clicado pelo Fernando.
- `.env.local` = banco de produção.
- Logs: em caminhos com dado de cliente use `errCode(e)` (`lib/log.ts`: tipo, código e constraint, sem mensagem), nunca `String(e)`. Sentry do navegador (`instrumentation-client.ts`) passa URL e breadcrumbs por `redactUrl` (token, `conversa`, `aviso`) e não manda texto de clique.
