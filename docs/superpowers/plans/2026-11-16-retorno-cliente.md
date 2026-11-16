# Plano · Histórico e retorno da cliente (Bubbly)

16/11/2026 · planejamento (sem código). Execução depois em worktree `claude/retorno-cliente`.

## Objetivo

1. Cada serviço tem um **retorno aproximado** (ex.: unha ~15 dias).
2. Ao **Concluir** um atendimento, o app pergunta **"Marcar o retorno da Ana?"** e já mostra dias e horários livres perto da data prevista.
3. O **cartão da cliente** mostra o histórico: visitas, intervalo real entre elas e o próximo retorno previsto.
4. (Bloco final) Lista **"Para chamar"**: quem passou da data e não tem horário marcado.

## O que já existe (main em #145)

| Peça                            | Onde                                                                                           | Reuso                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Concluir com Desfazer (6 s)     | `AppointmentCard.change("done")` → `updateStatus` → `core.setStatus`                           | Gancho do retorno                                                                     |
| Fechar tudo em lote             | `CloseAllButton`, `pendencias`                                                                 | Não abre pergunta (ver UX)                                                            |
| Abrir agendamento já preenchido | `QuickBook.openNewAppointment({clientId,date,time,serviceIds})`                                | A sugestão só preenche; agendar segue o fluxo normal (Órbita, WhatsApp, Google, .ics) |
| Horários livres                 | `hours/slots.freeSlots` (expediente − ocupados − pausa)                                        | Base das sugestões                                                                    |
| Resumo da cliente               | `clients/core.clientSummary` (próxima, última, visitas, gasto, faltas) + `ClientRow.CardSheet` | Estender com histórico e retorno                                                      |
| Multi-serviço                   | `appointment_services`                                                                         | Retorno = o menor entre os serviços com retorno                                       |

Nada de retorno existe hoje no banco.

## Modelo de dados (recomendado)

Migration **`0042_client_return.sql`** (0036–0040 são do plano Empresa, 0041 já está na main):

- `services.return_days integer NULL` (null = sem retorno; 1–365).
- `appointments.return_due_on date NULL`: data prevista do retorno, gravada **no momento em que o atendimento vira `done`** (no mesmo `withTenant` do `setStatus`), limpa se desfizer/mudar de status, ajustável à mão.
- `appointments.return_skipped_at timestamptz NULL`: "Não precisa" (some da lista Para chamar).
- Índice parcial `(tenant_id, return_due_on) WHERE return_due_on IS NOT NULL AND return_skipped_at IS NULL`.
- Sem tabela nova: o histórico vem de `appointments` (`done`) + `appointment_services`. RLS já cobre.

"Retorno marcado" é derivado: a cliente tem agendamento futuro não cancelado. Sem coluna de vínculo.

**Alternativa:** zero coluna em `appointments`, tudo calculado de `services.return_days` + última visita.
Trade-off: migration menor, mas mudar o retorno do serviço reescreve o passado, não dá para ajustar a data de uma cliente nem registrar "Não precisa". Não recomendo.

## Regras (puras, `features/returns/core.ts`, com teste)

- `returnDue(doneAt, services[])` → menor `return_days` entre os serviços do atendimento; null se nenhum tem.
- `returnWindow(due)` → dias de `due−2` a `due+3`, nunca antes de amanhã.
- `suggestReturnSlots({window, hours, busy, durationMin, professionalId?})` → até 4 dias com os 3 primeiros horários livres de cada (usa `freeSlots`). Duração = soma dos serviços do atendimento concluído.
- `intervals(visits[])` → dias entre visitas e média (para o cartão).

## Profissionais (plano Empresa)

- Depois da A2 (0037), `appointments.professional_id` existe: a sugestão usa a **mesma profissional** do atendimento concluído e os ocupados dela.
- Antes da A2 chegar na main: a sugestão olha o salão todo (como `vagas` hoje). O parâmetro `professionalId?` já nasce opcional, então não depende da branch de pagamentos.
- Conflito de migration: este plano usa **0042**. Se outra branch pegar 0042 antes, quem mergeia por último renumera (regra do AGENTS.md).

## UX (mobile primeiro, também desktop via `AdaptiveSheet`)

1. **Serviços > editar serviço:** campo "Retorno sugerido" com chips `Sem retorno · 7 · 15 · 21 · 30 · 45 · 60 dias · Outro`.
2. **Concluir (um atendimento):** toast de sucesso com Desfazer continua; logo depois abre a sheet **"Marcar o retorno da Ana?"** _somente se_ algum serviço tem retorno **e** a cliente não tem horário futuro.
   - Topo: "Unha volta em ~15 dias · seg, 01/12".
   - Até 4 dias (chips) e 3 horários livres por dia. Tocar no horário → `openNewAppointment` preenchido → fluxo normal de agendar.
   - "Ver outros dias" abre o agendamento com cliente + serviço + data prevista.
   - "Agora não" (fica na lista Para chamar) · "Não precisa" (grava `return_skipped_at`).
   - Desfazer o Concluir fecha a sheet e limpa a data.
3. **Fechar tudo em lote / Pendências:** não abre uma sheet por cliente; só grava as datas e o toast diz "3 retornos previstos, veja em Clientes".
4. **Cartão da cliente:** bloco "Retorno" (previsto ~01/12 · Agendar retorno · Ajustar data) e "Histórico" (últimas 10 visitas: data, serviço, "voltou após 16 dias"; média de dias).
5. **Para chamar** (Clientes, filtro no topo): previstos de hoje−30 até hoje+7, sem horário futuro, sem "Não precisa". Ação "Chamar no WhatsApp" abre a `ChatSheet` com texto pronto + vagas da semana (reuso de `share-text`). Envio **manual**.

Estados de carregando, erro (catálogo `lib/errors.ts`) e sucesso em tudo. Teclado iPhone: só chips, sem campo de texto (exceto "Outro" dias, 16px).

## WhatsApp automático de retorno (sugestão, não entra agora)

Worker mandaria "Oi Ana, já faz 15 dias, quer marcar?" no dia previsto. Recomendo **depois** do manual: gasta a cota de mensagens dos planos (400/mês no Essencial), precisa respeitar opt-out (`opted_out_at`), silêncio 21h–6h e claim no worker. Fica como Bloco 6 com chave liga/desliga em Ajustes > Mensagens.

## Blocos de execução (PRs pequenos)

| Bloco       | Entrega                                                              | Toca                            | Testes                             |
| ----------- | -------------------------------------------------------------------- | ------------------------------- | ---------------------------------- |
| B1          | Migration 0042 + `schema.ts` + campo no `ServiceForm` + `returnDue`  | servicos, db                    | unit `returns`, e2e `servicos`     |
| B2          | `setStatus` grava/limpa `return_due_on` (single e lote)              | agenda core                     | `tests/db/returns.test.ts`         |
| B3          | `suggestReturnSlots` + action `loadReturnSuggestions(appointmentId)` | returns, hours                  | unit slots/janela                  |
| B4          | Sheet "Marcar o retorno?" após Concluir + toast do lote              | AppointmentCard, CloseAllButton | e2e `retorno.spec.ts`              |
| B5          | Cartão da cliente: retorno + histórico                               | clients                         | db `clientSummary`, e2e `clientes` |
| B6          | Filtro "Para chamar" + texto manual de WhatsApp                      | clients, messaging              | e2e                                |
| B7 (depois) | Aviso automático de retorno no worker                                | reminders, worker               | db + Redeploy do worker            |

B1–B3 sem tela nova; B4 é o primeiro visível. Atualizar fichas `servicos.md`, `agenda.md`, `clientes.md` e criar `returns` no README dos módulos.

## Riscos

- Sheet depois do Concluir pode cansar: só aparece com serviço com retorno e sem horário futuro; "Não precisa" some para sempre naquele atendimento.
- Testes de banco só no Postgres local `assist_test` (porta 54331); `.env.local` aponta para produção.
- Migration aditiva (só colunas nulas), sem risco para dados existentes. Web precisa de Redeploy; worker só no B7.

## Decisões do usuário

1. Retorno como **um número aproximado** (recomendado) ou faixa "15 a 20 dias"?
2. Pergunta ao concluir **só para serviços com retorno** (recomendado) ou sempre?
3. WhatsApp de retorno: **manual primeiro** (recomendado) ou já automático?
4. Retorno igual para todas as clientes (padrão do serviço, ajustável na hora) ou aprender a média de cada cliente depois?
