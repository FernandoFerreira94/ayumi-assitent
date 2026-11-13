# Mapa de módulos

Atualizado em 12/11/2026 (main em #104). Ache o módulo da task, leia a coluna "Mexeu aqui? Confira" e abra **só** a ficha dele (e a do vizinho com ligação forte).

| Módulo | Ficha | Pastas | Finalidade | Mexeu aqui? Confira |
| --- | --- | --- | --- | --- |
| Agenda | [agenda.md](agenda.md) | `features/appointments`, `features/calendar`, `features/blocks`, telas `agenda`, `calendario`, `pendencias` | Agendar, editar, remarcar, status, bloqueios/pausas, dia/mês/ano | Google (sync), WhatsApp (msg de agendamento), lembretes, financeiro (valores), vagas (horário ocupado), sino/push |
| Clientes | [clientes.md](clientes.md) | `features/clients`, `features/contacts`, tela `clientes` | Cadastro, busca, cartão da cliente, importar contatos | Agenda (cliente do agendamento), WhatsApp (telefone/conversa), Google Contatos |
| Serviços | [servicos.md](servicos.md) | `features/services`, tela `servicos` | Catálogo: valor, duração, cor, ordem, pausar | Agenda (preço/duração), vagas (duração), financeiro (pizza), cores `--svc-*` |
| Vagas e expediente | [vagas.md](vagas.md) | `features/hours`, tela `vagas`, Ajustes > Expediente | Expediente/pausa por dia, horários livres, texto para divulgar | Agenda e bloqueios (ocupado), Google importado, avisos do dia (folga/fim do expediente) |
| Financeiro | [financeiro.md](financeiro.md) | `features/finance`, tela `financeiro` | Previsto/recebido por período, despesas, pizza por serviço | Agenda (valores, desconto, status), serviços |
| WhatsApp e conversas | [whatsapp.md](whatsapp.md) | `features/messaging`, `features/whatsapp`, `features/notifications`, `api/whatsapp/webhook` | Conectar número (Evolution), receber/enviar, IA lê respostas, sino | Lembretes, agenda (status muda), push, Ajustes |
| Lembretes | [lembretes.md](lembretes.md) | `features/reminders`, worker | 1º/2º aviso, "não respondeu", textos editáveis | WhatsApp (porta de envio), push, agenda (status), worker |
| Avisos do dia e push | [avisos-push.md](avisos-push.md) | `features/owner-notices`, `features/push`, worker | Push para a profissional (bom dia, folga, fim do expediente, semana, feriados) | Vagas (expediente), agenda, clima/localização, worker, VAPID |
| Google | [google.md](google.md) | `features/google` | Login Google, espelhar agendamentos no Google Agenda, importar eventos como ocupado | Agenda, vagas/bloqueios, contatos, Ajustes > Calendários |
| Calendário do iPhone | [calendario-iphone.md](calendario-iphone.md) | `features/calendar-feed`, rota `api/calendar/[token]` | Link assinado (webcal/ICS) com os agendamentos e leitura do calendário público do iCloud (eventos cinza, "Transformar em agendamento") | Agenda (bloqueios `icloud`, `fromBlockId`), Google (dedup), Vagas (ocupado), Ajustes > Calendários |
| Perfil, Ajustes e casca | [perfil-ajustes.md](perfil-ajustes.md) | `features/salon`, `features/tour`, `features/install`, `features/update`, `features/shell`, `features/settings`, telas `perfil`, `ajustes` (lista) e `ajustes/<secao>` | Dados do salão/pessoa, mascote/tema, IA, lista de Ajustes e seções, tour (só em Ajustes), instalar PWA, atualização e o que mudou (no Painel) | As seções de Ajustes mostram cartões de outros módulos |
| Marca e UI | [marca-ui.md](marca-ui.md) | `components/*`, `app/globals.css` | Mascote/temas, toasts, nav (barra, menu, sino), componentes base | Toda tela; mascote também no push |
| Plataforma | [plataforma.md](plataforma.md) | `db`, `lib`, `worker`, `proxy.ts`, `api/*`, `scripts` | Auth, estúdio/RLS, migrations, worker, deploy, backup | Tudo |

## Matriz de ligações (imports entre features)

Gerada por varredura de `@/features/*`. "Usa" = depende de; "Usado por" = quem quebra se a assinatura mudar.

| Feature | Usa | Usado por (além das telas) | Tabelas |
| --- | --- | --- | --- |
| appointments | blocks, calendar, clients, google, hours, messaging, services, whatsapp | calendar, clients, finance, google, hours, messaging, push, shell, nav | appointments, appointment_services, clients, services, blocks |
| blocks | — | appointments, hours | blocks, appointments |
| calendar | appointments, hours | appointments | appointments |
| clients | appointments, messaging | appointments | clients, appointments |
| contacts | google | — | clients |
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
| whatsapp | messaging | appointments, shell | tenants (instância) |

## Fluxos que cruzam módulos

- **Agendar**: `NewAppointmentSheet` → `appointments/actions.createAppointment` → `core.insertAppointment` (trava `blocks/core.lockTenant`, checa bloqueio/sobreposição) → `google/server.syncAppointmentSafe` → `messaging/booking-send.sendBookingMessage` → `BookingOverlay` (Órbita, cada etapa só fica verde quando o servidor responde).
- **Lembrete**: worker (5 min) → `reminders/run.runReminders` → `core.sendReminders` (1º/2º aviso via `messaging/port`) → `nudge.sendNudges` → `no-reply.notifyNoReplies` (push à dona).
- **Resposta da cliente**: Evolution → `api/whatsapp/webhook` (segredo na URL, `messaging/webhook-url`) → `messaging/inbound.handleInbound` → `replies.parseIntent` / IA `classify` + `ai-policy.planAiReply` → muda status do agendamento → push + sino (`notifications/core`).
- **Avisos do dia**: worker (5 min) → `owner-notices/run` → `plan.dueNotices` (regra pura) → `core.runTenantNotices` (textos/IA/clima) → `push/webpush`; `owner_notices` garante uma vez por dia.
- **Vagas**: `hours/slots` (expediente − agendamentos − bloqueios − eventos Google) → `ShareSheet`/`CustomSheet` → texto `share-text`.
