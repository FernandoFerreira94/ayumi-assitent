# Mapa de módulos

Atualizado em 17/11/2026 (main em #162, auditoria completa). Ache o módulo da task, leia a coluna "Mexeu aqui? Confira" e abra **só** a ficha dele (e a do vizinho com ligação forte).

| Módulo | Ficha | Pastas | Finalidade | Mexeu aqui? Confira |
| --- | --- | --- | --- | --- |
| Agenda | [agenda.md](agenda.md) | `features/appointments`, `features/calendar`, `features/blocks`, `features/dashboard` (Painel no desktop), telas `agenda`, `calendario`, `pendencias` | Agendar, editar, remarcar, status, bloqueios/pausas, dia/mês/ano | Google (sync), WhatsApp (msg de agendamento), lembretes, financeiro (valores), vagas (horário ocupado), sino/push |
| Clientes | [clientes.md](clientes.md) | `features/clients`, `features/contacts`, tela `clientes` | Cadastro, busca, cartão da cliente, importar contatos | Agenda (cliente do agendamento), WhatsApp (telefone/conversa), Google Contatos |
| Serviços | [servicos.md](servicos.md) | `features/services`, tela `servicos` | Catálogo: valor, duração, cor, ordem, pausar | Agenda (preço/duração), vagas (duração), financeiro (pizza), cores `--svc-*` |
| Vagas e expediente | [vagas.md](vagas.md) | `features/hours`, tela `vagas`, Ajustes > Expediente | Expediente/pausa por dia, horários livres, texto para divulgar | Agenda e bloqueios (ocupado), Google importado, avisos do dia (folga/fim do expediente) |
| Retorno da cliente | [agenda.md](agenda.md) (seção Retorno) e [servicos.md](servicos.md) | `features/returns` | Retorno aproximado por serviço, data prevista ao concluir, pergunta "Marcar o retorno?" com vagas | Serviços (`return_days`), agenda (`setStatus`), vagas (`freeSlots`), QuickBook |
| Financeiro | [financeiro.md](financeiro.md) | `features/finance`, tela `financeiro` | Previsto/recebido por período, despesas, pizza por serviço | Agenda (valores, desconto, status), serviços |
| Carteira da cliente | [carteira.md](carteira.md) | `features/wallet`, tela `ajustes/pagamentos` | Extrato imutável do dinheiro da cliente (sinal, crédito, devolução, pacotes), política de cancelamento/falta, Pix | Agenda (`insertAppointment`, `setPayment`), clientes (anonimizar), financeiro (caixa x ganhos), Ajustes |
| WhatsApp e conversas | [whatsapp.md](whatsapp.md) | `features/messaging`, `features/whatsapp`, `features/notifications`, `api/whatsapp/webhook` | Conectar número (Evolution), receber/enviar, IA lê respostas, sino | Lembretes, agenda (status muda), push, Ajustes |
| Lembretes | [lembretes.md](lembretes.md) | `features/reminders`, worker | 1º/2º aviso, "não respondeu", textos editáveis | WhatsApp (porta de envio), push, agenda (status), worker |
| Avisos do dia e push | [avisos-push.md](avisos-push.md) | `features/owner-notices`, `features/push`, worker | Push para a profissional (bom dia, folga, fim do expediente, semana, feriados) | Vagas (expediente), agenda, clima/localização, worker, VAPID |
| Google | [google.md](google.md) | `features/google` | Login Google, espelhar agendamentos no Google Agenda, importar eventos como ocupado | Agenda, vagas/bloqueios, contatos, Ajustes > Calendários |
| Calendário do iPhone | [calendario-iphone.md](calendario-iphone.md) | `features/calendar-feed`, rota `api/calendar/[token]` | Link assinado (webcal/ICS) com os agendamentos e leitura do calendário público do iCloud (eventos cinza, "Transformar em agendamento") | Agenda (bloqueios `icloud`, `fromBlockId`), Google (dedup), Vagas (ocupado), Ajustes > Calendários |
| Perfil, Ajustes e casca | [perfil-ajustes.md](perfil-ajustes.md) | `features/salon`, `features/tour`, `features/install`, `features/update`, `features/shell`, `features/settings`, telas `perfil`, `ajustes` (lista) e `ajustes/<secao>` | Dados do salão/pessoa, mascote/tema, IA, lista de Ajustes e seções, tour (só em Ajustes), instalar PWA, atualização automática (toast) | As seções de Ajustes mostram cartões de outros módulos |
| Marca e UI | [marca-ui.md](marca-ui.md) | `components/*`, `app/globals.css` | Mascote/temas, toasts, nav (barra, menu, sino), componentes base | Toda tela; mascote também no push |
| Painel do dono | [admin.md](admin.md) | `features/admin`, telas `admin/*` | Painel só do dono do produto: 2FA, step-up de 7 dias, registro de acesso; visão geral, assinantes e pagamentos (dados de exemplo até a cobrança chegar) | Auth (`twoFactor`, login por senha), retenção (worker), cabeçalhos (`next.config.ts`), `proxy.ts`, privacidade |
| Suporte e avisos do dono | [suporte.md](suporte.md) | `features/support`, telas `ajustes/suporte`, `admin/suporte`, `admin/avisos` | Conversa salão ↔ dono, avisos do dono no Painel de todos os salões | Painel (cartões no topo), Ajustes (linha Ajuda), admin (menu, registro), push (`notifyAdmins`, `sendToAll`) |
| Apps da loja | [apps-loja.md](apps-loja.md) | `mobile/`, `codemagic.yaml`, `features/native`, `app/.well-known` | Casca Capacitor do Android e iPhone que carrega o app web; links do domínio abrem o app | Domínio do app (`server.url`), instalar PWA (`isNativeShell`), login Google e push no app, regras de loja (sem venda no app) |
| Siri e Atalhos | [atalhos.md](atalhos.md) | `features/atalhos`, rotas `api/v1/atalhos/*` (sem tela no PWA desde 23/11; Siri só no app nativo) | Chave pessoal só leitura; a Siri lê agenda de hoje/amanhã, próxima cliente e resumo do dia | Agenda (`listDay`), tabela `api_tokens` |
| Plataforma | [plataforma.md](plataforma.md) | `db`, `lib`, `worker`, `proxy.ts`, `api/*`, `scripts`, `features/auth` (esqueci a senha), `features/retention`, `features/legal` | Auth, estúdio/RLS, migrations, worker, retenção LGPD, privacidade/termos, deploy, backup | Tudo |

## Matriz de ligações (imports entre features)

Gerada por varredura de `@/features/*`. "Usa" = depende de; "Usado por" = quem quebra se a assinatura mudar.

| Feature | Usa | Usado por (além das telas) | Tabelas |
| --- | --- | --- | --- |
| appointments | blocks, calendar, clients, google, hours, messaging, services, whatsapp | calendar, clients, finance, google, hours, messaging, push, shell, nav | appointments, appointment_services, clients, services, blocks |
| blocks | — | appointments, hours | blocks, appointments |
| calendar | appointments, hours | appointments | appointments |
| clients | appointments, messaging | appointments | clients, appointments |
| contacts | google | — | clients |
| returns | appointments, blocks, hours | appointments (AppointmentCard, setStatus) | appointments (return_due_on, return_skipped_at), services (return_days) |
| finance | appointments | — | appointments, expenses |
| google | appointments | appointments, contacts, shell | tenants, appointments, blocks, clients |
| calendar-feed | appointments | ajustes, appointments (DaySchedule), vagas | tenants (calendar_token_hash, calendar_hide_names, icloud_calendar_url), appointments, blocks (source icloud, external_uid, converted_at), clients, services |
| hours | appointments, blocks, services | appointments, calendar, owner-notices | working_hours, slot_lists, blocks |
| messaging | appointments, push, reminders | appointments, clients, notifications, reminders, shell, whatsapp, webhook, worker | messages, appointments, clients, tenants |
| notifications | messaging | nav (sino) | messages (via messaging) |
| owner-notices | hours, push | worker, brand | owner_notices, push_subscriptions, appointments, blocks |
| push | appointments | messaging, owner-notices, reminders, webhook, worker | push_subscriptions |
| reminders | messaging, push | messaging, nav, worker | appointments, tenants (configs) |
| salon | — | ajustes, perfil | tenants |
| services | — | appointments, hours | services, service_categories |
| shell | appointments, google, messaging, whatsapp | nav, ajustes | — |
| tour / install / update | — | layout, ajustes, login | — |
| support | admin (guard, audit, alerts), push | telas agenda, ajustes, admin | support_messages, platform_notices, platform_notice_dismissals |
| wallet | appointments (tipo PaymentMethod) | appointments (core), settings (summary) | client_ledger, tenants (política) |
| whatsapp | messaging | appointments, shell | tenants (instância) |
| admin | messaging, push, support | telas admin, nav (`isAdmin`), `lib/auth` (2FA), retention, support, worker | admin_step_up, admin_audit_log, "twoFactor", leitura de todas as tabelas como dono do banco |
| native | install | layout, login, `.well-known`, `api/native-auth`, clients, contacts | verification (código de uso único do Better Auth) |
| retention | admin | worker | access_log, messages, admin_audit_log, admin_step_up |
| atalhos | appointments, dashboard (rules) | rotas da API | api_tokens, appointments (leitura) |
| auth | — | `lib/auth`, tela `redefinir-senha` | tabelas do Better Auth |

## Fluxos que cruzam módulos

- **Agendar**: `NewAppointmentSheet` → `appointments/actions.createAppointment` → `core.insertAppointment` (trava `blocks/core.lockTenant`, checa bloqueio/sobreposição) → `google/server.syncAppointmentSafe` → `messaging/booking-send.sendBookingMessage` → `BookingOverlay` (Órbita, cada etapa só fica verde quando o servidor responde).
- **Lembrete**: worker (5 min) → `reminders/run.runReminders` → `core.sendReminders` (1º/2º aviso via `messaging/port`) → `nudge.sendNudges` → `no-reply.notifyNoReplies` (push à dona).
- **Resposta da cliente**: Evolution → `api/whatsapp/webhook` (segredo na URL, `messaging/webhook-url`) → `messaging/inbound.handleInbound` → `replies.parseIntent` / IA `classify` + `ai-policy.planAiReply` → muda status do agendamento → push + sino (`notifications/core`).
- **Avisos do dia**: worker (5 min) → `owner-notices/run` → `plan.dueNotices` (regra pura) → `core.runTenantNotices` (textos/IA/clima) → `push/webpush`; `owner_notices` garante uma vez por dia.
- **Vagas**: `hours/slots` (expediente − agendamentos − bloqueios − eventos Google) → `ShareSheet`/`CustomSheet` → texto `share-text`.
- **Retorno da cliente**: Concluir → `appointments/core.setStatus` grava `return_due_on` → `returns/ReturnPrompt` sugere dias/horários (`freeSlots`) → agendar normal; "Para chamar" em Clientes lista quem está no prazo.
- **Suporte**: salão escreve em Ajustes > Ajuda → `support/core.sendSupportMessage` → push ao dono (`notifyAdmins`) → resposta em `/admin/suporte` → push ao salão (`sendToAll`).
- **Login no app da loja**: `api/native-auth/start` (challenge) → Google no navegador do sistema → `finish` (código de uso único, 2 min) → `br.app.bubbly://auth` → `exchange` confere o segredo e abre a sessão na WebView.
- **Atualização do app**: `AutoUpdate` compara `api/version` ao abrir/voltar ao app; recarrega só sem sheet/diálogo/campo em foco; depois só o toast "App atualizado".

## Jobs do worker (pg-boss)

| Fila | Quando | Faz |
| --- | --- | --- |
| `send-reminders` | a cada 5 min | 1º e 2º aviso, respostas guardadas da noite, "não respondeu" (push) |
| `owner-notices` | a cada 5 min | avisos do dia no celular da dona (bom dia, folga, fim do expediente, semana, feriados) |
| `retention` | 04:15 BRT | apaga `access_log` > 200 dias, `messages` > 365, `admin_audit_log` > 365, `admin_step_up` > 7 dias |
| `admin-digest` | 09:00 BRT | resumo do dia anterior ao dono (precisa `ADMIN_USER_IDS` no worker) |

Partida do worker: desagenda `push-pendencias` (antiga) e reaponta o webhook de todas as instâncias.

## Fora da main (17/11/2026)

- **Pagamentos, planos e papéis (Empresa)**: só na branch local `claude/pagamentos-planos` (pasta `Projetos\ayumi-pagamentos`). Na main não há `role` em `memberships`, `professionals`, `professional_id`, planos nem gateway. O painel do dono mostra números de exemplo (`admin/demo-data.ts`) em Visão geral, Assinantes e Pagamentos.
- **Desktop/tablet Fases 2, 3a e 3b**: PRs rascunho #135, #136, #143. **Revisão de UX do suporte**: PR rascunho #153.

## Dívidas e furos conhecidos (auditoria 17/11)

| Item | Onde | Risco |
| --- | --- | --- |
| IA recebe texto cortado em 500 de mensagens até 1.000 | `messaging/quota.AI_TEXT_MAX` × `ai-policy.AI_MAX_CHARS` | Baixo: classificação com metade da mensagem |
| Fuso fixo UTC-3 | `lib/dates.ts` | Baixo hoje; quebra salão fora de Brasília (AM, MT, AC, Fernando de Noronha) |
| `support_messages` sem retenção própria | `retention/run.ts` | Baixo: LGPD pede prazo |
| `sendTestNotice` sem tela | `owner-notices/actions.ts` | Código morto |
| Log com `console.error(JSON.stringify(...))` fora de `lib/log` | `reminders/run.ts` | Baixo: foge do padrão de log |
| Migrations repetidas (`0026`, `0029`) e buracos | `db/migrations` | Ordem por nome; risco de conflito com a branch de pagamentos |
| ~100 branches remotas antigas (`f*`, `feat/*`, `claude/project-thread-*`) | GitHub | Ruído; apagar só com pedido escrito do usuário |
| Push nativo (FCM/APNs) inexistente | `apps-loja.md` | App da loja no iPhone sem notificação |
| Cobrança híbrida (IAP + site) decidida em 16/11 × regra "app não vende nada" | `apps-loja.md` | Rever ao implementar billing |
| Problema antigo "Google pede reconectar sempre" | `google.md` | Sem confirmação de que foi resolvido |

