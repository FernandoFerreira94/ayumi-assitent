# Agenda (agendamentos, calendário, bloqueios, pendências)

**Finalidade:** o centro do app. A profissional agenda uma cliente (um ou mais serviços, desconto, observação), vê o dia/semana/mês/ano, muda status, remarca, bloqueia horário/pausa e fecha o que passou em Pendências.

## Arquivos

- `features/appointments/actions.ts`: `createAppointment`, `rescheduleAppointment`, `editAppointmentAction`, `updateStatus(es)`, `loadBookingOptions`, `agendaVersion`.
- `features/appointments/core.ts`: `insertAppointment`, `moveAppointment`, `editAppointment`, `setStatus`, `listDay`, `forecastCents`, `receivedCents`, `serviceLabel`.
- `features/appointments/pricing.ts` (desconto % ou R$, nunca passa do subtotal), `schema.ts` (`STATUSES`), `timeline.ts`/`agenda-grid.ts` (grade fixa 06h–23h, estica se houver atendimento fora; lacunas "Livre"), `version.ts` (impressão digital do dia para `AgendaRefresh`), `pendencias.ts`, `briefing.ts`/`DayHero.tsx` (topo do Painel: Bolha com balão que aparece e some sozinho + rosca de ganhos do dia com olhinho; escolha de ocultar em `finance/hide-values.ts`, localStorage do aparelho), `sync-warning.ts`.
- UI: `AgendaDay`, `DaySchedule`, `WeekStrip`, `MonthPicker`, `AppointmentCard`, `NewAppointmentSheet` + `BookingServices`, `BookingOverlay` (Órbita), `EditAppointmentSheet`, `QuickBook` (evento do "Novo" do nav), `CloseAllButton`.
- `features/calendar/*`: casca do Calendário com zoom ano ↔ mês ↔ dia (`motion.ts`, `Pager.tsx`, `nav.ts`), dados por ano (`actions.calendarYear`, `data.ts`).
- `features/calendar/data.ts` (13/11): `loadYearDays` traz atendimentos **e eventos de fora** (`blocks.source` google/icloud, não convertidos) do ano; `buildYearDays` (puro) junta por dia no fuso do estúdio, em ordem de horário: `n` atendimentos, `x` eventos de fora, até 3 pílulas (evento de fora = pílula cinza `data-ext` com ícone Google/iPhone, título cortado em 24 letras). O "+N" conta os dois; o ano (pontinho) só conta atendimento. O layout do Calendário chama `syncExternalCalendars` antes de carregar (limite de 2 min por estúdio; importação em andamento é compartilhada com a tela do dia).
- `features/calendar/MonthStream.tsx`: no mês, rolagem vertical como no iPhone (caixa `.cal-scroll` própria, dias da semana fixos, `overflow-anchor: none`), **limitada a 3 meses** (13/11): o anterior, o aberto e o próximo (abrindo pelo Calendário, o aberto é o de hoje); folga no fim para o último mês chegar ao topo. O mês no topo vira `view.month` + URL (replace com atraso de 250ms); setas, deslizar, Hoje, ano ou URL reabrem a lista em volta do novo mês (`streamKey`).
- `features/blocks/*`: bloqueios/pausas (`insertBlock`, `removeBlock`, `listBlocks`, `overlapsBlock`, `lockTenant`).
- Telas: `app/(app)/agenda`, `app/(app)/calendario`, `app/(app)/pendencias`.

## Dados

- `appointments` (status, `starts_at`/`ends_at`, preço/desconto, `notes`, `google_event_id`, `reminder_sent_at`, `ai_handoff_at`...), `appointment_services` (multi-serviço, valor cheio de cada um), `blocks` (`source` = `app` | `google` | `icloud`; os de fora são só leitura, cinza com ícone de origem; `converted_at` = virou atendimento e não ocupa mais).
- Status: `pending_confirmation`, `confirmed`, `cancelled`, `done`, `no_show`, `reschedule_requested` (cliente pediu para remarcar; horário segue reservado até a dona decidir).

## Ligações

- **Usa:** services (preço/duração), clients, hours (expediente), blocks, google (`syncAppointmentSafe`, `importExternalEvents` ao abrir o dia), messaging (`sendBookingMessage`, conversa), whatsapp (estado).
- **Usado por:** finance (valores), reminders (quem avisar), messaging/inbound (muda status pela resposta), push/notifications (pendências), hours/vagas (ocupado), calendar, shell (status da casca).

## Fluxo de agendar

`createAppointment` valida (zod) → `withTenant` → `insertAppointment` (`lockTenant` serializa agendamento/bloqueio do estúdio; `overlapsBlock` → `SLOT_TAKEN`) → `revalidatePath('/agenda','/calendario')` → sync Google → mensagem de agendamento no WhatsApp → overlay mostra cada etapa só quando o servidor responde.

## Cuidados

- Toda criação/edição/remarcação passa por `lockTenant` + `overlapsBlock`; não pule.
- Fora do expediente (ou salão fechado) **não bloqueia** (13/11): `agenda-grid.conflictReason` só olha sobreposição; `outsideHours` vira aviso (dica do arraste em âmbar, texto no toast, aviso na folha de agendar, que recebe o expediente da semana via `week`). Pausa fixa do expediente continua ocupando.
- Painel (`/agenda`) não tem a fileira Bloquear/Agendar (`DaySchedule actions={false}`); Bloquear fica no Calendário, agendar pelo + da barra ou toque no vazio.
- Botão "Atualizar" pequeno (`RefreshButton`, 13/11) no `WeekStrip`: no Calendário à direita do título do dia, no Painel à direita do resumo. Chama `refreshAgenda` (força `forceSyncExternalCalendars`, Google + iCloud sem o limite de 2 min; toques em menos de 15 s caem no fluxo normal) e depois `router.refresh()`; ícone gira enquanto carrega, erro em toast com "Tentar de novo".
- Mudou o que a tela do dia mostra? Inclua no `version.ts`, senão o "Atualizar" não aparece em outro aparelho.
- Mudou status/horário: considere Google (sync), lembretes (`reminder_sent_at`) e sino.
- Animação Órbita só aqui; demais ações usam toast.
- Folhas de agendar/editar: Dia e Horário lado a lado (classe `pair`, `h-13` fixo porque o select do iOS ignora min-height); a folha rola (`max-h` + `overflow-y-auto`). Ao fechar o teclado, o `KeyboardWatcher` devolve a página para a rolagem de antes do foco (o iOS deixava a folha com o fim fora da tela).
- Testes: `tests/e2e/agenda*.spec.ts`, `agendamento.spec.ts`, `bloqueios.spec.ts`, `pendencias.spec.ts`, `mes.spec.ts`; `tests/db/reschedule.test.ts`; unit `agenda-grid`, `timeline`, `day-version`, `pricing`, `briefing`, `calendar-grid`, `month-picker`.
