# Lembretes (1º e 2º aviso, não respondeu)

**Finalidade:** o worker manda o 1º aviso (padrão 24 h antes) e o 2º aviso (padrão 3 h) pelo WhatsApp, respeitando horário de silêncio, e avisa a dona quando a cliente não respondeu. A dona edita os textos (agendamento, 1º, 2º e aviso ao remarcar, que pode ser desligado) e as horas em Ajustes > Mensagens.

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
- **Horário mudou** (`appointments/core.SCHEDULE_RESET`, 23/11): volta a aguardar confirmação e zera 1º e 2º aviso, não respondeu, resposta, pedido de cancelar, `ai_handoff_at` e `pending_reply`. Editar e "remarcar agora" zeram na hora; o arraste ("later") só zera quando o aviso de remarcação é processado (`reschedule-send`), então arrastar e desfazer não mexe em nada. Mudar só a duração não zera.
- **Sem lembrete logo após a confirmação:** agendou dentro da janela do 1º aviso → a confirmação vai com 1/2/3, grava `reminder_sent_at` e entra como `kind = reminder` (`booking-send` + `asFirstReminder`). Fora da janela, a confirmação é só informativa (`auto_reply`).
- 1º aviso só até 2 h antes do horário (`reminders/core.FIRST_MIN_LEAD_HOURS`, 23/11): em cima da hora (WhatsApp reconectado, rodada atrasada) não sai pedido de 1/2/3. Envio para a Evolution desiste em 10 s (`messaging/evolution.SEND_TIMEOUT_MS`) e vira falha temporária (`transient:timeout`), para não segurar a transação que trava os agendamentos; se tiver saído mesmo assim, pode repetir uma vez.
- **Aviso de cancelamento** (D3, 23/11, migration `0059`): o Cancelar do cartão pergunta "Avisar a cliente no WhatsApp" (ligado por padrão, só para horário futuro). `setStatus(..., notifyClient)` marca `appointments.cancel_notice_at` = agora + 15 s (`CANCEL_WAIT_MS`, depois do Desfazer); qualquer outro status limpa. O worker (`messaging/cancel-send.sendDueCancelNotices`, no `runReminders`) manda uma vez se continua cancelado, no futuro e sem SAIR; texto `reminders/text.cancelText`; grava como `auto_reply`. Falha temporária tenta de novo em 5 min.
- Cancelar, falta ou concluir apagam `pending_reply` (resposta da noite não sai com data velha).
- Mudou aqui: Redeploy do **worker** também.
- Testes: `tests/db/nudge.test.ts`, `tests/unit/reminder-text.test.ts`, `nudge.test.ts`, `booking-text.test.ts`.
- Opt-out: cliente que responde só `SAIR`/`PARAR`/`PARE`/`STOP` ganha `clients.opted_out_at` (`replies.parseOptOut`, tratado no `inbound.ts` antes da IA) e sai da confirmação (`booking-send`) e do 1º/2º aviso (`claimDue`/`claimNudges` filtram); `VOLTAR` desfaz. Resposta automática uma vez, na hora, mesmo à noite (24/11: sem ela a cliente não sabe se valeu). Mensagem manual da dona continua saindo.

## Regras de tempo (conferidas no código em 17/11)
- 1º aviso: `tenants.reminder_hours` (padrão 24 h antes); pode ser desligado (`tenants.first_reminder`, migration `0030`). Sem 1º aviso, o 2º vira o único lembrete.
- 2º aviso: `tenants.second_reminder_hours` (padrão 3 h; null = desligado). Só sai para quem recebeu o 1º há pelo menos 2 h e antes da janela do 2º (ou, sem 1º aviso, para agendamento criado antes da janela). Confirmadas recebem só lembrete; pendentes recebem pedido de confirmação (`nudge.claimNudges`). Desde 24/11 o 1º aviso faz o mesmo: quem já confirmou recebe `DEFAULT_REMINDER_CONFIRMED`, sem 1/2/3 (`claimDue` devolve `confirmed`).
- Silêncio: 21h–6h no fuso do estúdio (`reminders/quiet.ts`), vale para 2º aviso e respostas automáticas.
- Não respondeu (push à dona): 60 min depois do 2º aviso, ou 120 min depois do 1º quando não há 2º (`no-reply.ts`).
- Respostas da noite: a resposta automática para quem escreveu no silêncio fica em `appointments.pending_reply` (migration `0029_pending_reply`) e sai na primeira rodada depois das 6h (`messaging/pending.sendPendingReplies`, chamada pelo `runReminders`). Desde 23/11 guarda só o pedido (`@confirm`/`@cancel`/`@reschedule`, `messaging/pending-rules`); o texto é montado na hora de sair ("hoje" certo) e não sai se o status já não é o que a cliente pediu ou o horário passou. Texto antigo sai como está.

## Aviso ao remarcar (23/11)
- `tenants.reschedule_notice` (padrão ligado) e `reschedule_template` (null = `text.DEFAULT_RESCHEDULE`, sem {nome}, com 📍 {endereco} que some sem endereço). Texto: `text.rescheduleText` + link do convite ("Atualize na sua agenda").
- Dentro da janela do 1º aviso e pendente de confirmação: o aviso vai com 1/2/3 e grava `reminder_sent_at` (vale como 1º aviso; `reschedule-send.asFirstReminder`).
- `runReminders` chama `sendDueRescheduleNotices` antes do 1º aviso (rede de segurança do arraste; falha temporária volta em 5 min, `RETRY_MS`). Desconectado/número recusado não repete. Mensagem gravada como `kind = reminder` (não gasta o limite de respostas da IA). Fluxo completo em `agenda.md`.

## Textos (24/11, auditoria das mensagens)
- Doc da auditoria e catálogo de mensagens: `/mnt/project-files/auditoria-mensagens/auditoria-mensagens-whatsapp.md` (pasta do projeto).
- Ao agendar diz "está **agendado**", nunca "confirmado" (quem confirma é a cliente no 1º aviso). Rótulo em Ajustes: "Texto ao agendar". Horário que já passou não recebe mensagem (`booking-send`).
- 1º aviso padrão termina em "Pode me confirmar?" + 1/2/3.
- Respostas a 1/2/3 sem nome e na 1ª pessoa (`replies.ackText(intent, quando)`): "Prontinho! Seu horário de … está confirmado 💜", "Recebi seu pedido para cancelar/remarcar … Já te chamo por aqui …".
- Linha do pacote: "✨ Última sessão do seu pacote" quando n = total (> 1).
- Nova tentativa do aviso de cancelamento não sai de madrugada (`quiet.nextSendable`).

## Sinal nas mensagens (24/11, D2/D3 da auditoria)
- Ao agendar com sinal pendente, o padrão é `DEFAULT_BOOKING_DEPOSIT` ("Reservei seu horário…") + `depositLines` ("Para confirmar, falta só o sinal de R$ X / Pix / Pode me mandar o comprovante"). **Sem 1/2/3** mesmo dentro da janela do 1º aviso: quem confirma é o sinal.
- Pago ao agendar ("Já recebi"/tudo): linha "✅ Sinal de R$ X recebido." ou "✅ Pagamento recebido.".
- 1º e 2º aviso com sinal pendente (`claimDue`/`claimNudges` devolvem `depositLeft` via `wallet/core.paidCentsOf`): lembrete + "Lembrando que falta o sinal de R$ X para confirmar. Pix: …", sem 1/2/3.
- **Sinal recebido** (migration `0060`, `appointments.deposit_notice_at`): a folha de pagamento tem "Avisar a cliente no WhatsApp" (ligado, só sinal pedido e horário futuro). `updatePayment` → `appointments/core.afterPaymentChange`: sinal coberto agora + aviso = `deposit_notice_at` = agora + 15 s (`DEPOSIT_WAIT_MS`, depois do Desfazer); sem aviso = confirma na hora; qualquer outra mudança limpa. Worker `messaging/deposit-send.sendDueDepositNotices` (no `runReminders`, antes do 1º aviso) confirma o horário e manda `text.depositReceivedText` uma vez ("Recebi seu sinal de R$ X 💜 Seu horário de … está confirmado"), grava `auto_reply`. Nova tentativa não sai de madrugada.

## Confiabilidade e cancelamento (24/11, PR 6/7 da auditoria)
- Mensagem de agendamento que falha por instabilidade (`WHATSAPP_UNAVAILABLE`: rede, 5xx, timeout) ganha `appointments.booking_retry_at` (migration `0061`) = +5 min (nunca de madrugada) enquanto o agendamento tiver menos de 1 h (`BOOKING_RETRY_FOR_MS`). O worker (`booking-send.sendDueBookingRetries`, no `runReminders` antes do 1º aviso) toma o pendente e tenta de novo; se o 1º aviso já saiu, não manda. Desconectado ou número recusado não repete. Agendamento cancelado/fechado não recebe.
- Aviso de cancelamento editável em Ajustes > Mensagens ("Ao cancelar", `tenants.cancel_template`, null = `DEFAULT_CANCEL`). Linha automática quando o que a cliente pagou virou crédito (`wallet/core.creditFromAppointment`): "O valor de R$ X que você já tinha pago ficou como crédito…". Sinal retido nunca aparece.
- Remarcação com algo pago: linha "O que você já pagou continua valendo para o novo horário 💜".
- 1ª mensagem automática que a cliente recebe do estúdio (sem nenhuma mensagem de saída não manual antes) ganha "Se preferir não receber lembretes, é só responder SAIR." (`text.OPT_OUT_HINT`, só na mensagem de agendamento).
