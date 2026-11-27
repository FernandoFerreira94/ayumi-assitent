# Roadmap do Bubbly

> Fonte única de "o que já foi feito, o que está andando e o que falta" para colocar o Bubbly em **teste público**.
> Atualizado em **27/11/2026**, a partir da main (`dd9bf73`, PR #248), dos PRs mergeados e abertos, da auditoria de segurança de 13/11 (`../bubbly-auditoria/auditoria-seguranca-producao.md`) e dos tópicos do projeto.
> O que não deu para confirmar está marcado como **a confirmar**. Ao concluir um item, mova-o para "Feito" com o número do PR.

## Regras já decididas

- **Cadastro:** só pelo Google e restrito a `ALLOWED_EMAILS` até o lançamento público. Cadastro por senha desligado (`disableSignUp`).
- **Lançamento público** só abre com todos os requisitos legais cumpridos (LGPD, termos, verificação do Google).
- **Cobrança:** grátis no lançamento. Começa só cerca de 30 dias depois (`BILLING_STARTS_AT = null` e `BILLING_LIVE = false` até lá).
- **Apple:** a inscrição no Apple Developer (Organização) só acontece em **01/12**, quando vira o cartão. Tudo de iOS depende dela.

---

## 1. Feito

São 241 PRs mergeados (#1 a #248), todos em novembro de 2026.

| Área | O que existe | PRs |
|---|---|---|
| Base e infra | Fundação, multitenancy com RLS, login Google e e-mail/senha, observabilidade, backup por script | #1–3, #9, #12 |
| Deploy | Railway com migration no start; config em IaC (`.railway/railway.ts`): web em `app.bubbly.app.br`, worker, site `bubbly.app.br`, Evolution na rede privada | #16, #17, #141, #247 |
| CI | GitHub Actions rodando migrate, typecheck, lint, vitest e e2e (últimas execuções passando) | — |
| Agenda | Agenda, serviços, expediente, Vagas, bloqueios; Bolha, arrastar, calendário estilo iPhone; aviso do almoço; agendar em 4 passos; conclusão automática | #5, #6, #10, #26, #36, #56, #60, #119, #123, #189, #206, #210, #222, #225 |
| Clientes | Cadastro, importação (Google, .vcf, .csv), ficha com histórico, retorno sugerido, exclusão em lote | #4, #14, #54, #63, #150, #151, #215, #227, #230 |
| Financeiro e Carteira | Financeiro mensal, pagamento no agendamento, extrato, sinal, crédito, pacotes, promoções, Planos | #34, #52, #186, #191, #192, #196, #197, #199, #205, #207, #209, #217, #231 |
| WhatsApp | Lembretes via Evolution, IA que responde, silêncio 21h–6h, Pix copia e cola, sinal pendente, SAIR/VOLTAR | #11, #18, #72, #107, #201, #211, #212, #219, #221, #224, #232, #245 |
| Google Agenda | Sincronização, convites, importação, escopo reduzido a `calendar.events` | #7, #15, #57, #226 |
| iPhone e Siri | Link ICS/webcal, vários calendários, Siri e Atalhos | #115–117, #176, #184, #188, #228 |
| Notificações | Push, avisos do dia, mascotes, sino, avisos nativos | #13, #81, #85, #114, #165 |
| Segurança e LGPD | Excluir conta e dados, exportação, retenção, limites, webhook com HMAC por instância, CSP/HSTS, privacidade e termos completos no site | #108, #132, #134, #164, #220 |
| Painel do dono (/admin) | 2FA, step-up, números reais, tela de feedback | #139, #142, #145, #148, #149, #203, #234 |
| Desktop e tablet | Menu lateral e telas principais no desktop | #133, #168–180 |
| App Android | Casca Capacitor, login Google, contatos, AAB assinado, Google Agenda pelo navegador | #146, #154, #155, #243, #244 |
| Codemagic | Builds Android no plano grátis (`mac_mini_m2`), grupo `firebase` com `GOOGLE_SERVICES_JSON`; workflows `android-debug`, `android-release`, `ios-testflight` | #246, #248 |
| Lançamento | Suporte no app, tour de primeiro acesso, "Grátis durante o lançamento", regra de fundadora, cartão de feedback/NPS | #152, #198, #240 |
| Avisos de deploy | Avisos de deploy e erro via ntfy (tópico concluído em 27/11) | a confirmar nº do PR |

### Auditoria de segurança de 13/11: situação na main

| Achado | Status |
|---|---|
| C1 fallback `EVOLUTION_INSTANCE` | ✓ Corrigido |
| C2 testes podiam apagar produção | ✓ Corrigido (`tests/db-guard.ts`) |
| A1 sequestro de conta / "esqueci a senha" | ✓ Corrigido |
| A2 tokens do Google em texto puro | ✓ Corrigido (tokens cifrados) |
| A3 LGPD: exclusão e exportação | ✓ Corrigido |
| A4 webhook com segredo único | ✓ Corrigido (HMAC por instância) |
| A5 cabeçalhos de segurança | ✓ Corrigido |
| M1 SSRF pelo push | ✓ Corrigido |
| M2 desconectar não revogava | ✓ Corrigido |
| M3 limites de uso | ◐ Parcial (cota de mensagens; limite por IP só nas rotas de senha) |
| M4 registro de acesso | ✓ Corrigido |
| M5 retenção | ✓ Corrigido |
| M6 verificação do Google | ✗ Pendente |
| M7 equipe com papéis | ✗ Pendente (depois do lançamento) |
| M8 CI parado | ✓ Corrigido |
| M9 backup com restauração testada | ✗ Pendente |
| B1 limites em memória | ? A confirmar |
| B2 worker em série | — Aceitável no piloto |
| B3 fuso fixo UTC-3 | ✗ Não corrigido (aceitável no piloto em SP) |
| B5 logs de erro | ? A confirmar |
| B7 Sentry no navegador | ✓ Corrigido |

---

## 2. Em andamento

| Item | Onde está | Próximo passo | Dono |
|---|---|---|---|
| E-mail `suporte@bubbly.app.br` | Cloudflare Email Routing; MX nulo já removido | Clicar em **Add missing records** e criar a rota `suporte` → Gmail, confirmar o link de verificação | Fernando |
| Google Play | App criado em 27/11; build AAB e `GOOGLE_SERVICES_JSON` no Codemagic já na main | Ficha da loja, Segurança dos dados (contatos), teste interno; conta como Organização (a confirmar) | Fernando, Claude ajuda nos textos |
| Verificação do Google OAuth | PR #233 (rascunho): roteiro e legendas do vídeo | Gravar o vídeo (`scripts/demo-video/record.ts`) e enviar no Google Cloud | Fernando grava/envia, Claude no roteiro |
| Sign in with Apple | Decidido login pelo navegador; passos anotados na memória do projeto; branch local vazia | Aguardar conta Apple (01/12), depois Team ID, App ID, Services ID, chave .p8, configuração e botão | Fernando (conta), depois Claude |
| Pagamentos (Mercado Pago) e plano Empresa | Plano em `docs/superpowers/plans/2026-11-15-pagamentos-planos-empresa.md` (não versionado) | Aprovar decisões do plano; implementar perto do fim dos 30 dias grátis | Claude, com OK do Fernando |
| Equipe com várias profissionais | PR #175 (rascunho, parado desde 18/11) | Retomar depois dos pagamentos | Claude |
| Desktop/tablet Fases 2, 3a, 3b | PRs #135, #136, #143 (rascunho, parados desde 15–17/11) | Provavelmente superados por #168–180: revisar e fechar | Fernando decide |
| UX do Suporte e avisos | PR #153 (rascunho, parado desde 16/11) | Revisar ou fechar | Fernando decide |

---

## 3. Falta para o teste público

### Bloqueantes

| # | Item | Por quê | Dono | Depende de |
|---|---|---|---|---|
| B1 | **Definir como o público entra.** Hoje só entra quem está em `ALLOWED_EMAILS` (lista vazia = ninguém) | Sem isso o teste público não começa | Fernando decide; Claude implementa | Regra de lançamento (requisitos legais) |
| B2 | **Verificação do Google OAuth (M6)** | Sem ela aparece "app não verificado" e há limite de 100 usuários | Fernando | Vídeo do PR #233; privacidade e termos já no ar |
| B3 | **Backup diário com restauração testada (M9).** `scripts/backup.ts` existe, mas não há Cron de backup no IaC | Perda de dados sem volta | Claude coloca no IaC; Fernando cria o bucket e as variáveis `BACKUP_*` | Bucket S3-compatível |
| B4 | **Trocar o contato de suporte/DPO.** `site/public/privacidade.html` ainda cita o Gmail pessoal | Requisito LGPD e da verificação do Google | Claude troca o texto | `suporte@bubbly.app.br` funcionando |
| B5 | **Confirmar variáveis de produção no Railway** (web e worker): `RESEND_API_KEY`, `EMAIL_FROM` com domínio verificado, `ANTHROPIC_API_KEY`, `FCM_SERVICE_ACCOUNT`, `ANDROID_CERT_SHA256`, e que `EVOLUTION_INSTANCE` foi apagada | "Esqueci a senha", IA e push dependem delas | Fernando (ou Claude via MCP do Railway, com OK) | — |
| B6 | **Confirmar que a main está no ar** e a migration 0065 foi aplicada | O start roda `db:migrate`, mas não foi conferido; havia redeploy web+worker pendente | Claude via MCP do Railway, com OK | — |

### Desejáveis (antes ou logo após abrir)

| Item | Dono | Observação |
|---|---|---|
| Sentry no worker e alertas: erro do worker, WhatsApp desconectado, falha de backup; monitor de uptime | Claude (código); Fernando cria DSN | Sentry já está no web e no navegador |
| Limite de uso compartilhado (M3/B1): limite nas importações e contador fora da memória | Claude | Hoje o limite do Better Auth fica em memória |
| Completar o `.env.example` com todas as variáveis (faltam `ANTHROPIC_API_KEY`, `EVOLUTION_*`, `SENTRY_*`, `VAPID_*`, `ADMIN_USER_IDS`, `ANDROID_CERT_SHA256`, `BACKUP_*`) | Claude | Só nomes, nunca valores |
| Monitorar desconexões do WhatsApp (API não oficial) | Claude | O termo já avisa do risco |
| Fuso por salão (B3) | Claude | Necessário só para venda fora de SP |
| Resend: domínio de envio verificado | Fernando | A confirmar |
| INPI: registro da marca Bubbly | Fernando | A confirmar se já foi iniciado |
| Higiene do repo: apagar `chore/codemagic` local (já mergeada) e `claude/sign-in-apple` vazia; decidir os 2 planos não versionados | Fernando | — |

### Depois do lançamento

| Item | Quando | Dono |
|---|---|---|
| Apple Developer (Organização) | **01/12** | Fernando |
| Sign in with Apple, App Store Connect, `APP_STORE_APPLE_ID` no Codemagic, TestFlight | Depois de 01/12 | Fernando + Claude |
| Cobrança via Mercado Pago, `BILLING_STARTS_AT` com data | ~30 dias após o lançamento | Claude, com OK do Fernando |
| Equipe com papéis (M7, PR #175) | Depois da cobrança | Claude |
| Dashboard do dono, Bloco 2 (cobrança real) | Depois da cobrança | Claude |

---

## A confirmar

- Se o deploy atual está no ar e se a migration 0065 foi aplicada.
- Se existe Cron de backup no painel e se um restore já foi testado.
- Quais variáveis estão de fato no Railway (web e worker).
- Se o domínio de envio do Resend está verificado.
- Status do Google OAuth (modo teste ou produção; envio feito ou não).
- Status das contas Play (Organização) e Apple.
- Se os limites em memória (B1) e a limpeza de logs de erro (B5) foram tratados.
- Se o Sentry tem DSN em produção e o que contém `ADMIN_USER_IDS`.
- Situação do INPI.

## Referências

- Configuração: [`docs/CONFIGURACAO.md`](CONFIGURACAO.md)
- Módulos: [`docs/modulos/`](modulos/)
- Planos: [`docs/planos/`](planos/)
- Auditoria: `../bubbly-auditoria/auditoria-seguranca-producao.md` (fora do repo)
- Migrations: `src/db/migrations/` (0001 a 0065, rodadas por `pnpm db:migrate`)
