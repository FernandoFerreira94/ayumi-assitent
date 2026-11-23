# Agenda (agendamentos, calendário, bloqueios, pendências)

**Finalidade:** o centro do app. A profissional agenda uma cliente (um ou mais serviços, desconto, observação), vê o dia/semana/mês/ano, muda status, remarca, bloqueia horário/pausa e fecha o que passou em Pendências.

## Arquivos

- `features/appointments/actions.ts`: `createAppointment`, `rescheduleAppointment`, `editAppointmentAction`, `updateStatus(es)`, `loadBookingOptions`, `agendaVersion`.
- `features/appointments/core.ts`: `insertAppointment`, `moveAppointment`, `editAppointment`, `setStatus`, `listDay`, `forecastCents`, `receivedCents`, `serviceLabel`.
- `features/appointments/pricing.ts` (desconto % ou R$, nunca passa do subtotal), `schema.ts` (`STATUSES`), `timeline.ts`/`agenda-grid.ts` (grade fixa 06h–23h, estica se houver atendimento fora; lacunas "Livre"), `version.ts` (impressão digital do dia para `AgendaRefresh`), `pendencias.ts`, `briefing.ts`/`DayHero.tsx` (topo do Painel: Bolha com balão que aparece e some sozinho + rosca de ganhos do dia com olhinho; escolha de ocultar em `finance/hide-values.ts`, localStorage do aparelho), `sync-warning.ts`.
- UI: `AgendaDay`, `DaySchedule`, `WeekStrip`, `MonthPicker`, `AppointmentCard`, `NewAppointmentSheet` + `BookingSteps` (agendar em 4 passos), `BookingOverlay` (Órbita), `EditAppointmentSheet`, `QuickBook` (evento do "Novo" do nav), `CloseAllButton`.
- `features/calendar/*`: casca do Calendário com zoom ano ↔ mês ↔ dia (`motion.ts`, `Pager.tsx`, `nav.ts`), dados por ano (`actions.calendarYear`, `data.ts`).
- `features/calendar/data.ts` (13/11): `loadYearDays` traz atendimentos **e eventos de fora** (`blocks.source` google/icloud, não convertidos) do ano; `buildYearDays` (puro) junta por dia no fuso do estúdio, em ordem de horário: `n` atendimentos, `x` eventos de fora, até 3 pílulas (evento de fora = pílula cinza `data-ext` com ícone Google/iPhone, título cortado em 24 letras). O "+N" conta os dois; o ano (pontinho) só conta atendimento. O layout do Calendário chama `syncExternalCalendars` antes de carregar (limite de 2 min por estúdio; importação em andamento é compartilhada com a tela do dia).
- `features/calendar/MonthStream.tsx`: no mês, rolagem vertical como no iPhone (caixa `.cal-scroll` própria, dias da semana fixos, `overflow-anchor: none`), **limitada a 3 meses** (13/11): o anterior, o aberto e o próximo (abrindo pelo Calendário, o aberto é o de hoje); folga no fim para o último mês chegar ao topo. O mês no topo vira `view.month` + URL (replace com atraso de 250ms); setas, deslizar, Hoje, ano ou URL reabrem a lista em volta do novo mês (`streamKey`).
- `features/blocks/*`: bloqueios/pausas (`insertBlock`, `removeBlock`, `listBlocks`, `overlapsBlock`, `lockTenant`).
- Telas: `app/(app)/agenda`, `app/(app)/calendario`, `app/(app)/pendencias`, `app/(app)/agendamentos`.

## Dados

- `appointments` (status, `starts_at`/`ends_at`, preço/desconto, `notes`, `google_event_id`, `reminder_sent_at`, `ai_handoff_at`...), `appointment_services` (multi-serviço, valor cheio de cada um), `blocks` (`source` = `app` | `google` | `icloud`; os de fora são só leitura, cinza com ícone de origem; `converted_at` = virou atendimento e não ocupa mais).
- Status: `pending_confirmation`, `confirmed`, `cancelled`, `done`, `no_show`, `reschedule_requested` (cliente pediu para remarcar; horário segue reservado até a dona decidir).

## Ligações

- **Usa:** services (preço/duração), clients, hours (expediente), blocks, google (`syncAppointmentSafe`, `importExternalEvents` ao abrir o dia), messaging (`sendBookingMessage`, conversa), whatsapp (estado).
- **Usado por:** finance (valores), reminders (quem avisar), messaging/inbound (muda status pela resposta), push/notifications (pendências), hours/vagas (ocupado), calendar, shell (status da casca).

## Fluxo de agendar

`createAppointment` valida (zod) → `withTenant` → `insertAppointment` (`lockTenant` serializa agendamento/bloqueio do estúdio; `overlapsBlock` → `SLOT_TAKEN`) → `revalidatePath('/agenda','/calendario')` → sync Google → mensagem de agendamento no WhatsApp (com o link do convite .ics) → overlay mostra cada etapa só quando o servidor responde.

## Convite para a agenda da cliente (16/11)

- A mensagem de agendamento leva "📲 Salve na sua agenda: <link>" no fim, ou onde a dona puser `{agenda}` no texto (Ajustes > Mensagens). Sem `BETTER_AUTH_URL`/segredo, sai sem o link.
- Link: `/api/agenda/convite/<token>.ics` (`calendar-feed/invite-token.ts`): token = ids do estúdio e do agendamento + HMAC do `BETTER_AUTH_SECRET` (12 bytes). Sem nome/telefone; não dá para montar o link de outro agendamento. Inválido, apagado ou 7 dias após o fim: 404 igual.
- ICS (`ics.inviteIcs`, montado em `calendar-feed/invite.ts`): título "Serviço · Estúdio", endereço do estúdio em LOCATION, alarme 2h antes, UID fixo `invite-<id>@bubbly`, SEQUENCE = segundos desde a criação e DTSTAMP/LAST-MODIFIED = agora (sempre a versão mais nova; mesmo UID substitui o evento salvo). Cancelado = `STATUS:CANCELLED`, sem alarme. Remarcou/cancelou: o mesmo link já serve o novo estado; ao remarcar, o aviso no WhatsApp leva o link de novo ("Atualize na sua agenda"), e abrir atualiza o evento salvo (mesmo UID). Cancelar não manda mensagem.

## Retorno ao concluir (16/11)

- `core.setStatus`: virar `done` grava `appointments.return_due_on` (menor `services.return_days` entre os serviços do atendimento, contado do dia no fuso do estúdio; `returns/rules.returnDue`). Qualquer outro status (inclusive Desfazer) limpa `return_due_on` e `return_skipped_at`. Vale para um e para o lote (`updateStatuses`, que devolve `returns` = quantos ganharam data; o toast do "Concluir todos" mostra "N retornos previstos").
- `AppointmentCard` → Concluir → `returns/ReturnPrompt.openReturnPrompt` (folha global no layout, como o `QuickBook`). Ela chama `returns/actions.loadReturnSuggestions` e só abre se há data, sem "Não precisa" e a cliente **não** tem horário futuro; aí some o toast e a folha traz o próprio Desfazer. Sugere até 4 dias perto da data (2 antes a 5 depois, nunca hoje) com 3 horários espalhados (`freeSlots` com a duração dos serviços + maior intervalo, ocupados = agendamentos + bloqueios + Google/iCloud). Tocar no horário abre `openNewAppointment` preenchido (fluxo normal). "Não precisa" = `skipReturn` (`return_skipped_at`).
- Profissional (plano Empresa, **ainda não existe na main** em 17/11; está na branch local de pagamentos): quando `appointments.professional_id` existir, passe a profissional do atendimento para os ocupados e o expediente.

## Painel no tablet/desktop (18/11)

- `/agenda` com `PageShell wide`. Celular igual a antes: a página detecta o aparelho (`userAgent().device.type === "mobile"`) e **não monta nem consulta** as caixas do desktop.
- Tablet/desktop (`md`/`lg`): faixa de números (DayHero + `PeriodCards`: semana, mês com % vs. o mesmo período do mês anterior e saldo, confirmações de hoje), `NextClient` (atendendo agora/próxima; em outro dia, a primeira; visitas, última visita, faltas, observação da ficha + do atendimento, Conversa e Remarcar em folha), agenda com abas Dia/Semana (`AgendaTabs`, escolha em localStorage `bubbly:painel-visao`; Semana = `WeekGlance`) e coluna lateral: `MiniMonth` (setas trocam o mês; outro ano via `calendar/actions.calendarYear`; clique leva a `/agenda?d=`), pendências (resumo de `listPendencias`), Para chamar (`DueReturns`), vagas de hoje/amanhã do 1º serviço de Vagas (`freeSlots`) e atalhos (Agendar, Bloquear, Nova cliente, Lançar gasto).
- Dados: `features/dashboard/data.ts` → `loadDashboard` com `cache()` do React (as caixas chamam separado, o banco é lido uma vez por pedido). Regras puras em `dashboard/rules.ts` (testes em `tests/unit/dashboard-rules.test.ts`). Cada caixa tem esqueleto (Suspense) e erro com "Tentar de novo" (`DeskError`).
- Valores respeitam o olhinho (`useValuesHidden`); a Semana mostra só contagem (é componente do servidor).
- `WeekStrip` ganhou `ResizeObserver`: se a largura muda depois de pintar, volta para a semana escolhida.

## Lista de agendamentos com sinal (23/11)

- Tela `/agendamentos` (menu "Agendamentos", grupo "more"): só visão. Hoje até 60 dias, sem cancelados/faltas (`appointments/agendamentos.listAhead`, reaproveita `pendencias.appointmentRows`).
- Regras puras em `appointments/deposit-list.ts`: `depositGroup` (a partir do `paymentView`: sinal pago, sinal pedido, sem sinal, pago), `summarize`, `inPeriod` (Hoje, 7 dias, Próximos + busca sem acento), `byDay`, `dayHeading`.
- UI `DepositAgenda.tsx`: 4 caixas de resumo que também filtram, período, busca, lista por dia; tocar abre o `AppointmentCard` numa folha (Sinal recebido, Confirmar etc.). `?periodo=` e `?sinal=` (deposit|requested|none|paid) abrem filtrado; a URL acompanha sem recarregar.
- Ações da agenda revalidam `/agendamentos` junto com `/agenda`. Testes: `tests/unit/deposit-list.test.ts`, `tests/e2e/agendamentos.spec.ts`.

## Cuidados

- **Faltou só depois do início** (19/11): `appointments/no-show.ts` (`canMarkNoShow`). `core.setStatus` recusa `no_show` antes de `starts_at` com `NO_SHOW_TOO_EARLY` (vale para `updateStatus` e o lote). No `AppointmentCard` (agenda, Pendências, detalhe, celular e desktop) o botão fica desligado com "Faltou: disponível a partir das HH:MM" e liga sozinho na hora.
- Toda criação/edição/remarcação passa por `lockTenant` + `overlapsBlock`; não pule.
- Fora do expediente (ou salão fechado) **não bloqueia** (13/11): `agenda-grid.conflictReason` só olha sobreposição; `outsideHours` vira aviso (dica do arraste em âmbar, texto no toast, aviso na folha de agendar, que recebe o expediente da semana via `week`).
- **Pausa do expediente (almoço) só avisa** (23/11): `agenda-grid.pauseHit`/`pauseOverlap` (encostar não conta; duração = soma dos serviços). Folha de agendar e de remarcar (`EditAppointmentSheet`, recebe `minutes` e busca `week` em `loadBookingOptions`) mostram o aviso âmbar e, ao salvar, `PauseConfirm` ("Agendar/Salvar mesmo assim" ou "Escolher outro horário"). No arraste/setas a pausa (`PAUSE_ID`) saiu dos ocupados: a dica fica âmbar "pega a pausa" e o toast diz "Pega sua pausa". Vagas e `nextFree` continuam pulando a pausa. Servidor não confere pausa. Agendamento pela IA/cliente não passa por aqui (fora de escopo). Teste: `tests/unit/pause-overlap.test.ts`, `tests/e2e/pausa.spec.ts`.
- Painel (`/agenda`) não tem a fileira Bloquear/Agendar (`DaySchedule actions={false}`); Bloquear fica no Calendário, agendar pelo + da barra ou toque no vazio.
- Botão "Atualizar" pequeno (`RefreshButton`, 13/11) no `WeekStrip`: no Calendário à direita do título do dia, no Painel à direita do resumo. Chama `refreshAgenda` (força `forceSyncExternalCalendars`, Google + iCloud sem o limite de 2 min; toques em menos de 15 s caem no fluxo normal) e depois `router.refresh()`; ícone gira enquanto carrega, erro em toast com "Tentar de novo".
- Mudou o que a tela do dia mostra? Inclua no `version.ts`, senão o "Atualizar" não aparece em outro aparelho.
- Mudou status/horário: considere Google (sync), lembretes (`reminder_sent_at`) e sino.
- Animação Órbita só aqui; demais ações usam toast.
- Folhas de agendar/editar: Dia e Horário lado a lado (classe `pair`, `h-13` fixo porque o select do iOS ignora min-height); a folha rola (`max-h` + `overflow-y-auto`). Ao fechar o teclado, o `KeyboardWatcher` devolve a página para a rolagem de antes do foco (o iOS deixava a folha com o fim fora da tela).
- Testes: `tests/e2e/retorno.spec.ts`, `tests/db/returns.test.ts`, `tests/unit/returns.test.ts`, `tests/e2e/agenda*.spec.ts`, `agendamento.spec.ts`, `bloqueios.spec.ts`, `pendencias.spec.ts`, `mes.spec.ts`; `tests/db/reschedule.test.ts`; unit `agenda-grid`, `timeline`, `day-version`, `pricing`, `briefing`, `calendar-grid`, `month-picker`.

## Pendências no desktop (18/11)
- `/pendencias` com `PageShell wide` (loading também). No `lg` as seções viram colunas de quadro (`auto-fit, minmax(300px)`) com fundo suave e contador no título. Celular igual.

## Pagamento da cliente (19/11)
- Manual, sem gateway. `appointments.paid_at` (quando a dona marcou; antes de `starts_at` = "Pago adiantado") e `payment_method` opcional (`pix` | `dinheiro` | `cartao`, só com `paid_at`; migration 0048).
- Regras puras em `appointments/payment.ts` (`paymentState`, `paymentView`, `parsePayment`). Sem marcação: concluído = "Pago no atendimento"; em aberto = "A pagar".
- Marcar: na folha de agendar (`PaymentFields form`, campos `paid`/`paymentMethod`) ou depois pelo selo do `AppointmentCard` → `PaymentSheet` → `actions.updatePayment` → `core.setPayment` (não mexe em status nem valor; cancelado não aceita marcação nova). Toast com Desfazer.
- `listDay` e `pendencias` trazem `paidAt`/`paymentMethod`; `version.ts` inclui o pago.
- Testes: `tests/unit/payment.test.ts`, `tests/db/payment.test.ts`, `tests/e2e/pagamento.spec.ts`.
- 19/11 (carteira): marcar/desmarcar pago e agendar já pago também gravam no extrato `client_ledger` (ver [carteira.md](carteira.md)).
- 19/11 (carteira PR 2): estado `deposit` (sinal), `paidCents` em `listDay`/`pendencias`/`version.ts`; concluir grava o resto no extrato e sair de concluído anula. Ver [carteira.md](carteira.md).
- 19/11 (carteira PR 3): `setStatus` acerta a carteira ao cancelar/faltar (crédito ou sinal retido) e devolve `wallet`; `insertAppointment` usa o crédito da cliente sozinho. Ver [carteira.md](carteira.md).
- 19/11 (carteira PR 4): agendar com pacote usa a sessão sozinho; o serviço entra pelo valor da sessão (`appointments.client_package_id`). Ver [carteira.md](carteira.md).

## Agendar em 4 passos (23/11)

- `BookingSteps` (dentro de `NewAppointmentSheet`, mesma Órbita e mesmo `createAppointment`, campos do form iguais): **Para quem?** (busca 16px, recentes de `bookingExtras.recentClientIds`, lista por letra com índice; tocou, avança) → **Qual serviço?** (cartões, até 5, total e duração no rodapé; com 1 serviço só, avança) → **Quando?** (faixa de 14 dias + "Outro dia"; horários livres de `bookingSlots(date, serviceIds)` = `freeSlots` com soma das durações + maior intervalo, grade de 15 min; "Outro horário" abre o seletor livre com aviso de fora do expediente/pausa) → **Tudo certo?** (resumo editável, total grande; Desconto, Sinal (Sem/Pedir à cliente/Já recebi), Já pagou tudo, Observação e prévia do WhatsApp = `bookingText`, cada um num diálogo; promoção com interruptor; `PauseConfirm` no rodapé).
- Pula o que veio escolhido: cliente (ficha), serviços (Vagas/retorno), horário tocado (`timeTapped`). O horário do botão Agendar da agenda é só sugestão (`timeTapped=false`): o "Quando?" aparece com ele marcado. Erro do servidor volta ao passo do campo (`SLOT_TAKEN` → Quando?).
- Desktop/tablet: painel de 720 px com a coluna "Resumo" sempre à vista. Passo novo desliza (`.bk-step`, sem animação com movimento reduzido) e recebe o foco.
- Testes: `tests/e2e/agendar.ts` (`preencheAgendar`) usado pelos specs que agendam; `agendamento.spec.ts` cobre os passos, horários livres e o diálogo de desconto.

## Aviso de remarcação no WhatsApp (23/11)
- `core.moveAppointment`/`editAppointment` devolvem `{ moved }` e recebem `notice` (`now` folha Remarcar, `later` arraste, `skip` a dona desligou o switch "Avisar ... no WhatsApp" só desta vez). Horário mudou: grava `appointments.reschedule_notice_at` (pendente; arraste = agora + 8 s, `NOTICE_UNDO_MS`) e `notified_starts_at = coalesce(notified_starts_at, horário antigo)` (o horário que a cliente conhece). Migration 0056.
- Envio: `messaging/reschedule-send.sendRescheduleNotice` (claim atômico do pendente; igual ao conhecido = `unchanged`, então arrastar e Desfazer não manda nada). Folha Remarcar manda na hora (`editAppointmentAction` devolve `notice`); arraste: `reschedule-notice.scheduleRescheduleNotice` chama `flushRescheduleNotice` 8,5 s depois (só o horário final vai); o worker (`send-reminders`) manda o que ficou vencido.
- Toast do resultado: `messaging/reschedule-result.rescheduleNoticeToast` (enviado, WhatsApp desconectado, número sem WhatsApp, tenta de novo, cliente pediu SAIR; cala em não mudou/desligado/sem WhatsApp). Remarcar nunca falha por causa do aviso.
- Testes: `tests/db/reschedule-notice.test.ts`, `tests/unit/reschedule-text.test.ts`, e2e em `agenda-dia.spec.ts` e `ajustes.spec.ts`.
