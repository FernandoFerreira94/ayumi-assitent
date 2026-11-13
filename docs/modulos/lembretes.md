# Lembretes (1º e 2º aviso, não respondeu)

**Finalidade:** o worker manda o 1º aviso (padrão 24 h antes) e o 2º aviso (padrão 3 h) pelo WhatsApp, respeitando horário de silêncio, e avisa a dona quando a cliente não respondeu. A dona edita os três textos (agendamento, 1º, 2º) e as horas em Ajustes > Mensagens.

## Arquivos
- `features/reminders/run.ts` (`runReminders`: todos os estúdios; erro de um não para os outros).
- `core.ts`: `claimDue`/`release` (claim para não mandar duas vezes), `sendReminders`, `getReminderSettings`, `getMessageSettings`, `saveMessageSettings`.
- `nudge.ts` (2º aviso, `isQuietHour`, `claimNudges`), `no-reply.ts` (`claimNoReplies`, `notifyNoReplies`), `text.ts` (modelos com `{chaves}`), `actions.saveMessages`, `MessagesForm.tsx`.
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
