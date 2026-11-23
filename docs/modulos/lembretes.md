# Lembretes (1º e 2º aviso, não respondeu)

**Finalidade:** o worker manda o 1º aviso (padrão 24 h antes) e o 2º aviso (padrão 3 h) pelo WhatsApp, respeitando horário de silêncio, e avisa a dona quando a cliente não respondeu. A dona edita os três textos (agendamento, 1º, 2º) e as horas em Ajustes > Mensagens.

## Arquivos
- `features/reminders/run.ts` (`runReminders`: todos os estúdios; erro de um não para os outros).
- `core.ts`: `claimDue`/`release` (claim para não mandar duas vezes), `sendReminders`, `getReminderSettings`, `getMessageSettings`, `saveMessageSettings`.
- `nudge.ts` (2º aviso, `isQuietHour`, `claimNudges`), `no-reply.ts` (`claimNoReplies`, `notifyNoReplies`), `text.ts` (modelos com `{chaves}`: nome, servico, dia, hora, valor, salao, endereco, mapa; desde 23/11 os padrões não têm `{nome}`, a dona põe se quiser; o de agendamento traz 📍 `{endereco}` e 🗺️ `{mapa}`, que somem sem endereço), `actions.saveMessages` (texto igual ao padrão vira null; salvar volta para `/ajustes`), `MessagesForm.tsx`.
- Worker: `src/worker/index.ts`, fila a cada 5 min.

## Dados
- `appointments` (`reminder_sent_at` e colunas de 2º aviso/não respondeu), `tenants` (`reminder_template`, `second_reminder_template`, `booking_template`, `reminder_hours`, `second_reminder_hours`).

## Ligações
- **Usa:** messaging (porta de envio), push (não respondeu).
- **Usado por:** messaging (textos e estado do aviso ao ler respostas), nav/sino, worker.

## Cuidados
- Sempre claim antes de enviar e `release` em falha; dois workers não podem mandar o mesmo aviso.
- Falha **recusada** (`MessagingRejectedError`, 400 da Evolution, ex.: número sem WhatsApp) não volta para a fila: fica como tentado. Só falha temporária/offline faz `release`. Toda falha loga `reminder_send_failed`/`nudge_send_failed`/`pending_send_failed` com o id do agendamento e o motivo (nunca o telefone).
- Não reenviar aviso de horário que já passou; remarcar/cancelar precisa invalidar aviso pendente.
- Mudou aqui: Redeploy do **worker** também.
- Testes: `tests/db/nudge.test.ts`, `tests/unit/reminder-text.test.ts`, `nudge.test.ts`, `booking-text.test.ts`.
- Opt-out: cliente que responde só `SAIR`/`PARAR`/`PARE`/`STOP` ganha `clients.opted_out_at` (`replies.parseOptOut`, tratado no `inbound.ts` antes da IA) e sai da confirmação (`booking-send`) e do 1º/2º aviso (`claimDue`/`claimNudges` filtram); `VOLTAR` desfaz. Resposta automática uma vez, fora do silêncio 21h–6h. Mensagem manual da dona continua saindo.

## Regras de tempo (conferidas no código em 17/11)
- 1º aviso: `tenants.reminder_hours` (padrão 24 h antes); pode ser desligado (`tenants.first_reminder`, migration `0030`). Sem 1º aviso, o 2º vira o único lembrete.
- 2º aviso: `tenants.second_reminder_hours` (padrão 3 h; null = desligado). Só sai para quem recebeu o 1º há pelo menos 2 h e antes da janela do 2º (ou, sem 1º aviso, para agendamento criado antes da janela). Confirmadas recebem só lembrete; pendentes recebem pedido de confirmação (`nudge.claimNudges`).
- Silêncio: 21h–6h no fuso do estúdio (`reminders/quiet.ts`), vale para 2º aviso e respostas automáticas.
- Não respondeu (push à dona): 60 min depois do 2º aviso, ou 120 min depois do 1º quando não há 2º (`no-reply.ts`).
- Respostas da noite: a resposta automática para quem escreveu no silêncio fica em `appointments.pending_reply` (migration `0029_pending_reply`) e sai na primeira rodada depois das 6h (`messaging/pending.sendPendingReplies`, chamada pelo `runReminders`).
