# Agenda (agendamentos, calendário, bloqueios, pendências)

**Finalidade:** o centro do app. A profissional agenda uma cliente (um ou mais serviços, desconto, observação), vê o dia/semana/mês/ano, muda status, remarca, bloqueia horário/pausa e fecha o que passou em Pendências.

## Arquivos
- `features/appointments/actions.ts`: `createAppointment`, `rescheduleAppointment`, `editAppointmentAction`, `updateStatus(es)`, `loadBookingOptions`, `agendaVersion`.
- `features/appointments/core.ts`: `insertAppointment`, `moveAppointment`, `editAppointment`, `setStatus`, `listDay`, `forecastCents`, `receivedCents`, `serviceLabel`.
- `features/appointments/pricing.ts` (desconto % ou R$, nunca passa do subtotal), `schema.ts` (`STATUSES`), `timeline.ts`/`agenda-grid.ts` (grade 08h–20h, lacunas "Livre"), `version.ts` (impressão digital do dia para `AgendaRefresh`), `pendencias.ts`, `briefing.ts`/`DayBubble.tsx` (balão do dia), `sync-warning.ts`.
- UI: `AgendaDay`, `DaySchedule`, `WeekStrip`, `MonthPicker`, `AppointmentCard`, `NewAppointmentSheet` + `BookingServices`, `BookingOverlay` (Órbita), `EditAppointmentSheet`, `QuickBook` (evento do "Novo" do nav), `CloseAllButton`.
- `features/calendar/*`: casca do Calendário com zoom ano ↔ mês ↔ dia (`motion.ts`, `Pager.tsx`, `nav.ts`), dados por ano (`actions.calendarYear`, `data.ts`).
- `features/blocks/*`: bloqueios/pausas (`insertBlock`, `removeBlock`, `listBlocks`, `overlapsBlock`, `lockTenant`).
- Telas: `app/(app)/agenda`, `app/(app)/calendario`, `app/(app)/pendencias`.

## Dados
- `appointments` (status, `starts_at`/`ends_at`, preço/desconto, `notes`, `google_event_id`, `reminder_sent_at`, `ai_handoff_at`...), `appointment_services` (multi-serviço, valor cheio de cada um), `blocks` (`source` = `app` | `google`, google é só leitura).
- Status: `pending_confirmation`, `confirmed`, `cancelled`, `done`, `no_show`, `reschedule_requested` (cliente pediu para remarcar; horário segue reservado até a dona decidir).

## Ligações
- **Usa:** services (preço/duração), clients, hours (expediente), blocks, google (`syncAppointmentSafe`, `importExternalEvents` ao abrir o dia), messaging (`sendBookingMessage`, conversa), whatsapp (estado).
- **Usado por:** finance (valores), reminders (quem avisar), messaging/inbound (muda status pela resposta), push/notifications (pendências), hours/vagas (ocupado), calendar, shell (status da casca).

## Fluxo de agendar
`createAppointment` valida (zod) → `withTenant` → `insertAppointment` (`lockTenant` serializa agendamento/bloqueio do estúdio; `overlapsBlock` → `SLOT_TAKEN`) → `revalidatePath('/agenda','/calendario')` → sync Google → mensagem de agendamento no WhatsApp → overlay mostra cada etapa só quando o servidor responde.

## Cuidados
- Toda criação/edição/remarcação passa por `lockTenant` + `overlapsBlock`; não pule.
- Mudou o que a tela do dia mostra? Inclua no `version.ts`, senão o "Atualizar" não aparece em outro aparelho.
- Mudou status/horário: considere Google (sync), lembretes (`reminder_sent_at`) e sino.
- Animação Órbita só aqui; demais ações usam toast.
- Testes: `tests/e2e/agenda*.spec.ts`, `agendamento.spec.ts`, `bloqueios.spec.ts`, `pendencias.spec.ts`, `mes.spec.ts`; `tests/db/reschedule.test.ts`; unit `agenda-grid`, `timeline`, `day-version`, `pricing`, `briefing`, `calendar-grid`, `month-picker`.
