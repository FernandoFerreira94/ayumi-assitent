# Painel do dono (admin)

**Finalidade:** painel pessoal do dono do produto (só ele) para acompanhar assinaturas, pagamentos e receita do Bubbly. Plano: `docs/superpowers/plans/2026-11-15-dashboard-dono.md`. Bloco 1 (este) = acesso seguro; Bloco 2 = views de leitura; Bloco 3 = telas com dados.

## Arquivos
- Regras puras: `features/admin/access.ts` (`isPlatformAdmin`, lê `ADMIN_USER_IDS`), `features/admin/step-up-rules.ts` (janela de 7 dias, trava de 5 erros em 15 min).
- Banco: `features/admin/step-up.ts` (`admin_step_up`), `features/admin/audit.ts` (`admin_audit_log`, rótulos pt-BR).
- Porta única: `features/admin/guard.ts` (`requireAdmin`: sessão → admin? senão `notFound()` → 2FA ligado? senão `/admin/ativar-2fa` → step-up válido? senão `/admin/verificar`). `requireAdminWithoutTwoFactor` só para a ativação.
- Actions: `features/admin/actions.ts` (`verifyAdminCode`, `startTwoFactorSetup`, `confirmTwoFactorSetup`, `regenerateBackupCodes`).
- Telas: `app/admin/layout.tsx` (sem banco, sem menu; `robots: noindex`), `app/admin/page.tsx` (casca da visão geral), `verificar`, `ativar-2fa`, `seguranca`. UI em `features/admin/ui/*` (`AdminNav` no visual do `SideNav`, `AdminShell`, `CodeForm`, `TwoFactorSetup`, `BackupCodes`, `RegenerateCodes`).
- Auth: `lib/auth.ts` (plugin `twoFactor` + hook que deixa `/two-factor/*` só para admin), `lib/auth-client.ts` (`twoFactorClient`), `app/login/LoginForm.tsx` (passo "Código" quando o login por senha volta com `twoFactorRedirect`).
- Cabeçalhos: `next.config.ts` (`/admin` e `/admin/:path*`: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`). `proxy.ts`: sem login, `/admin*` vira 404 (não manda para o login).

## Tabelas (migration `0041_admin_access.sql`, sem GRANT para `app_user`)
- `user."twoFactorEnabled"` e `"twoFactor"` (plugin do Better Auth; segredo e códigos cifrados pelo próprio plugin com o `BETTER_AUTH_SECRET`). Apagar o usuário apaga o 2FA (cascade).
- `admin_step_up(session_id → session.id ON DELETE CASCADE, user_id, verified_at)`: logout apaga a verificação.
- `admin_audit_log(user_id, action, target, ip, created_at)`: `view_overview`, `view_security`, `step_up_ok`, `step_up_failed`, `2fa_enabled`, `backup_codes_regenerated` (e no Bloco 3 `view_subscribers`, `view_subscriber`, `view_payments`, `export_payments`).
- Retenção (`features/retention/run.ts`, worker diário): `admin_audit_log` > 365 dias e `admin_step_up` > 7 dias.

## 2FA (resultado da Task 0, Better Auth 1.7.18, lido no código do plugin)
- (a) Login pelo Google **não** é parado: o hook do plugin só olha `/sign-in/email|username|phone-number`. Por isso o `/admin` faz step-up próprio.
- (b) `auth.api.verifyTOTP` com sessão aberta confere o código **sem criar sessão** (no caminho com sessão o plugin não conta tentativas: a trava de 5 erros/15 min é nossa, pelas linhas `step_up_failed`). Exceção: no **primeiro** código (ativação) o plugin liga `twoFactorEnabled` e **troca a sessão** (cookie novo). Por isso a ativação não grava o step-up e manda para `/admin/verificar`.
- (c) `enableTwoFactor` exige senha. Com `allowPasswordless: true`, quem só entra pelo Google ativa sem senha; quem tem senha precisa digitá-la (campo opcional na tela; erro `ADMIN_PASSWORD_REQUIRED`). Mesma regra para gerar códigos novos.
- (d) Efeito colateral: com 2FA ligado, o **login por e-mail e senha** do dono pede o código logo depois da senha (`twoFactorRedirect`); o `LoginForm` mostra o passo "Código de acesso" (`authClient.twoFactor.verifyTotp` ou `verifyBackupCode`).
- Hook `before` no `auth.ts`: com sessão, `/two-factor/*` só para quem está em `ADMIN_USER_IDS` (outra pessoa recebe 404); sem sessão, só `verify-totp` e `verify-backup-code` (passo do login).

## Configuração
- `ADMIN_USER_IDS` (Railway, serviço web): ids de `"user".id` separados por vírgula. Vazia = ninguém é admin. Achar o id: `select id from "user" where email = '<e-mail do dono>'`.
- e2e sobe o servidor com `ADMIN_USER_IDS=e2e-admin` (`playwright.config.ts`).

## Cuidados
- Toda leitura, action e página de `/admin` chama `requireAdmin()` (o layout não roda de novo a cada navegação). Menu (`AdminNav`) só dentro de página, depois do guard, para não revelar o painel.
- Com `cacheComponents`, o guard roda dentro do `Suspense` do layout: o 404 de quem está logado e não é admin vem como tela "Não encontramos isto" (meta `noindex`); o status HTTP 404 de verdade só no caso sem login (proxy).
- Nunca logar código, segredo, código de recuperação, e-mail ou nome. Erros com `errCode(e)`.
- O painel só lê; nunca escreve em tabela de cobrança nem chama o Mercado Pago (Bloco 2 usa o papel `bubbly_admin` só leitura).
