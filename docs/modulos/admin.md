# Painel do dono (admin)

**Finalidade:** painel pessoal do dono do produto (só ele) para acompanhar assinaturas, pagamentos e receita do Bubbly. Plano: `docs/superpowers/plans/2026-11-15-dashboard-dono.md`. Bloco 1 = acesso seguro (feito); Bloco 3 = telas (feito; visão geral com números reais desde 23/11, cobrança vazia até o Bloco 2); Bloco 2 = views de leitura reais (espera as tabelas de cobrança chegarem na main).

## Arquivos
- Regras puras: `features/admin/access.ts` (`isPlatformAdmin`, lê `ADMIN_USER_IDS`), `features/admin/step-up-rules.ts` (janela de 7 dias, trava de 5 erros em 15 min).
- Banco: `features/admin/step-up.ts` (`admin_step_up`; `withStepUpSlot` = uma tentativa de código por vez por admin, com `pg_try_advisory_xact_lock`: tentativas em paralelo voltam `ADMIN_STEP_UP_BUSY` em vez de furar a trava; `countOtherSessions`/`deleteOtherSessions`), `features/admin/audit.ts` (`admin_audit_log`, rótulos pt-BR).
- Porta única: `features/admin/guard.ts` (`requireAdmin`: sessão → admin? senão `notFound()` → 2FA ligado? senão `/admin/ativar-2fa` → step-up válido? senão `/admin/verificar`). `requireAdminWithoutTwoFactor` só para a ativação.
- Actions: `features/admin/actions.ts` (`verifyAdminCode`, `startTwoFactorSetup`, `confirmTwoFactorSetup`, `regenerateBackupCodes` (exige o código do app na hora: com 7 dias de acesso, sessão roubada não gera códigos novos), `endOtherSessions` (Segurança → Aparelhos conectados; derruba também as sessões do app do salão da mesma conta)).
- Telas: `app/admin/layout.tsx` (sem banco, sem menu; `robots: noindex`), `app/admin/page.tsx` (visão geral), `assinantes` (`?salao=<id>` abre o detalhe), `pagamentos` (`?mes=YYYY-MM`) + `pagamentos/export/route.ts` (CSV), `error.tsx`, `verificar`, `ativar-2fa`, `seguranca`. UI em `features/admin/ui/*` (`AdminNav` no visual do `SideNav`, `AdminShell`, `CodeForm`, `TwoFactorSetup`, `BackupCodes`, `RegenerateCodes`).
- Auth: `lib/auth.ts` (plugin `twoFactor` + hook que deixa `/two-factor/*` só para admin), `lib/auth-client.ts` (`twoFactorClient`), `app/login/LoginForm.tsx` (passo "Código" quando o login por senha volta com `twoFactorRedirect`).
- Cabeçalhos: `next.config.ts` (`/admin` e `/admin/:path*`: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`). `proxy.ts`: sem login, `/admin*` vira 404 (não manda para o login).

## Telas e dados
- Contrato das linhas: `features/admin/types.ts` (camelCase das views do plano). Contas puras e testadas: `metrics.ts` (`summarize`, `delinquencyBuckets`, `upcomingDue`, `receivedInMonth`, `trialConversion`, `healthLevel`, `cancellations`, `trialsEnding`), `filters.ts` (abas, busca sem acento, ordem), `csv.ts` (`;`, BOM, CRLF, anti-fórmula), `month.ts` (`?mes=` com zod; inválido ou futuro = mês atual em UTC-3).
- **Desde 23/11 não há mais dado de exemplo nas telas.** Visão geral = números REAIS da plataforma: `platform.ts` (`getPlatformStats`, SQL como dono do banco: clientes não anonimizadas, pessoas com acesso (`memberships`), agendamentos do mês e do anterior sem cancelados, mensagens enviadas/recebidas no mês, série de 12 meses de salões novos e agendamentos; meses em São Paulo convertidos para timestamptz) + `getUsage()` (salões, ativos 7 dias, WhatsApp). Regras puras em `platform-rules.ts` (`pctChange`, `recentSalons`, `idleSalons`, `daysSince`). UI: `MonthBars` (barras de contagem no visual do MrrChart), `SalonLists` (Chegaram em 30 dias, Parados há 7+ dias; só nome do salão), `BillingPending` (estado vazio honesto da cobrança). Nenhum dado de cliente final.
- Cobrança: `queries.ts` (`server-only`; cada função chama `requireAdmin()`) devolve vazio com `BILLING_LIVE = false`; Assinantes e Pagamentos mostram `BillingPending`. O Bloco 2 troca só o corpo dessas funções por SQL nas views (`withAdmin`) e liga `BILLING_LIVE`; as telas de cobrança (MrrChart, HealthBar, OverviewLists, SubscribersView, PaymentsView) voltam sozinhas. Os dados inventados ficaram só para teste em `tests/fixtures/admin-demo.ts`; `monthKey`/`shiftMonth` foram para `month.ts`.
- UI: `KpiCard`, `MrrChart` (barras HTML, uma série na cor da marca, dica no hover/foco, tabela `sr-only` dentro de `<div class="sr-only">` porque `<table>` não encolhe e alargava a página no celular), `HealthBar`, `OverviewLists`, `SubscribersView` (cartões < 1024 px, tabela acima), `SubscriberSheet` (vaul: folha no celular, painel à direita no desktop), `PaymentsView`, `StatusBadge`/`PaymentBadge` (sempre com texto).
- Tela **Uso** (`app/admin/uso`, dados REAIS, não depende da cobrança): `usage.ts` (SQL como dono do banco, igual ao worker; por salão: último uso = sessão/login de membros, WhatsApp ligado, clientes, agendamentos 30 dias sem cancelados, mensagens enviadas/recebidas 30 dias) e `usage-rules.ts` (`summarizeUsage`: ativos 7 dias, mensagens por salão ativo = base do custo).
- Tela **Respostas** (`app/admin/respostas`): respostas a lembretes que o sistema não entendeu, de todos os salões, agrupadas por texto parecido (`messaging/unclear-rules.groupUnclear`, padrão `unclearPattern`), sem rótulo primeiro. Mostra só texto, salão, o que o sistema fez e o palpite da IA (nunca nome/telefone da cliente). Rótulo por grupo: `messaging/unclear-actions.labelUnclearReplies` (`unclear_labeled`, target = `rótulo:quantas`); abrir = `view_unclear`. Dados em `whatsapp.md`.
- Registro: telas `view_*` não repetem a mesma linha (mesma ação e alvo) em 2 min; ações sempre gravam. Visão geral `view_overview`; uso `view_usage`; desconectar `sessions_revoked` (target = quantas); assinantes `view_subscribers` ou `view_subscriber` (target = id do salão); pagamentos `view_payments`; CSV `export_payments` (target = mês).
- Link "Abrir no Mercado Pago": ainda não; o detalhe só mostra o id da assinatura. Entra no Bloco 2 com a URL real.

## Avisos para o dono (push)
- `alerts.ts` (plataforma, sem requireAdmin): `notifyAdmins` manda para as inscrições de push (`push_subscriptions`) de quem está em `ADMIN_USER_IDS` e apaga as vencidas; `collectDigest` junta os números de ontem (UTC-3) e confere na Evolution os salões com WhatsApp caído. Textos em `alerts-text.ts` (sem nome de salão/pessoa: o push passa pela Apple/Google).
- Cadastro novo: `lib/auth.ts` (hook `user.create.after`, depois do commit) chama `alertSignup()` sem esperar; falha não afeta o cadastro.
- Resumo da manhã: fila `admin-digest` no worker, 09:00 BRT. **Precisa de `ADMIN_USER_IDS` também no serviço do worker** e do push ligado no celular do dono (no app, com a conta dele).
- Futuro: aviso de pagamento recusado / cobrança parada entra quando a cobrança chegar (mesmo `notifyAdmins`).

## Suporte e avisos
- Atalho no app do salão: `components/nav/menu-data.ts` devolve só `isAdmin` (de `isPlatformAdmin`); com ele o menu do avatar (`AppMenu`) e o menu lateral (`SideNav`) mostram o item **Admin** (`ADMIN_NAV_ITEM` em `nav-items.ts`, ícone escudo `admin`), com `prefetch={false}` porque cada visita ao `/admin` entra no registro. É só conforto: quem barra continua sendo o `requireAdmin`.
- Telas `admin/suporte` e `admin/avisos`, e o número de conversas esperando no menu: ver [suporte.md](suporte.md).

## Tabelas (migration `0041_admin_access.sql`, sem GRANT para `app_user`)
- `user."twoFactorEnabled"` e `"twoFactor"` (plugin do Better Auth; segredo e códigos cifrados pelo próprio plugin com o `BETTER_AUTH_SECRET`). Apagar o usuário apaga o 2FA (cascade).
- `admin_step_up(session_id → session.id ON DELETE CASCADE, user_id, verified_at)`: logout apaga a verificação.
- `admin_audit_log(user_id, action, target, ip, created_at)`: `view_overview`, `view_security`, `step_up_ok`, `step_up_failed`, `2fa_enabled`, `backup_codes_regenerated` `view_subscribers`, `view_subscriber`, `view_payments`, `export_payments`.
- Retenção (`features/retention/run.ts`, worker diário): `admin_audit_log` > 365 dias e `admin_step_up` > 7 dias.

## 2FA (resultado da Task 0, Better Auth 1.7.18, lido no código do plugin)
- (a) Login pelo Google **não** é parado: o hook do plugin só olha `/sign-in/email|username|phone-number`. Por isso o `/admin` faz step-up próprio.
- (b) `auth.api.verifyTOTP` com sessão aberta confere o código **sem criar sessão** (no caminho com sessão o plugin não conta tentativas: a trava de 5 erros/15 min é nossa, pelas linhas `step_up_failed`). Exceção: no **primeiro** código (ativação) o plugin liga `twoFactorEnabled` e **troca a sessão** (cookie novo). Por isso a ativação não grava o step-up e manda para `/admin/verificar`.
- (c) `enableTwoFactor` exige senha. Com `allowPasswordless: true`, quem só entra pelo Google ativa sem senha; quem tem senha precisa digitá-la (campo opcional na tela; erro `ADMIN_PASSWORD_REQUIRED`). Mesma regra para gerar códigos novos.
- (d) Efeito colateral: com 2FA ligado, o **login por e-mail e senha** do dono pede o código logo depois da senha (`twoFactorRedirect`); o `LoginForm` mostra o passo "Código de acesso" (`authClient.twoFactor.verifyTotp` ou `verifyBackupCode`).
- Hook `before` no `auth.ts`: com sessão, `/two-factor/*` só para quem está em `ADMIN_USER_IDS` (outra pessoa recebe 404); sem sessão, só `verify-totp` e `verify-backup-code` (passo do login).

## Depois do login
- Todo login (senha, código 2FA, Google `callbackURL`, app da loja `NativeBridge`, e `/login` com sessão no `proxy.ts`) passa por `app/entrar/route.ts`: dono (`isPlatformAdmin`) vai ao `/admin` (o `requireAdmin` segue pedindo 2FA/step-up), o resto ao `/agenda`; sem sessão, `/login?sessao=invalida` (evita laço). Regra pura em `features/admin/landing.ts`. O redirect usa `Location` relativo: `request.url` em route handler no Railway é `localhost:8080` (bug de 18/11, login do Google caía no localhost). Abrir o app depois (start_url `/agenda`) não redireciona.
- Sair no tablet/desktop: `components/nav/SideNavSignOut.tsx` no pé do menu lateral do app (`SideNav`) e do `/admin` (`AdminNav`), com diálogo de confirmação; usa `signOutAndReload` de `SignOutButton.tsx` (o mesmo do menu do celular).

## Configuração
- `ADMIN_USER_IDS` (Railway, serviço web): ids de `"user".id` separados por vírgula. Vazia = ninguém é admin. Achar o id: `select id from "user" where email = '<e-mail do dono>'`.
- e2e sobe o servidor com `ADMIN_USER_IDS=e2e-admin` (`playwright.config.ts`).

## Cuidados
- Toda leitura, action e página de `/admin` chama `requireAdmin()` (o layout não roda de novo a cada navegação). Menu (`AdminNav`) só dentro de página, depois do guard, para não revelar o painel.
- Com `cacheComponents`, o guard roda dentro do `Suspense` do layout: o 404 de quem está logado e não é admin vem como tela "Não encontramos isto" (meta `noindex`); o status HTTP 404 de verdade só no caso sem login (proxy).
- Nunca logar código, segredo, código de recuperação, e-mail ou nome. Erros com `errCode(e)`.
- O painel só lê; nunca escreve em tabela de cobrança nem chama o Mercado Pago (Bloco 2 usa o papel `bubbly_admin` só leitura).
