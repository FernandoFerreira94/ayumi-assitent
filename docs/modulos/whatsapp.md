# WhatsApp, conversas e sino

**Finalidade:** ligar o número do estúdio (Evolution API, código de pareamento), mandar mensagens (agendamento, lembretes, avulsas), receber respostas, deixar a IA ler o texto livre da cliente e avisar a dona pelo sino e push.

## Arquivos
- Conexão: `features/whatsapp/core.ts` (`instanceName` = `studio-<id>`, `startPairing`, `currentState`), `webhook.ts` (garante webhook na instância), `actions.ts`, `WhatsAppCard.tsx`, `QrImage.tsx`. Admin Evolution: `messaging/evolution-admin.ts`.
- Envio: `messaging/port.ts` (porta), `evolution.ts` (implementação, `messagingForInstance`), `send.ts` (avulsa), `booking-send.ts` (`sent`/`failed`/`skipped`).
- Entrada: `app/api/whatsapp/webhook/route.ts` (MESSAGES_UPSERT; segredo na URL via `webhook-url.ts`, derivado do `BETTER_AUTH_SECRET`) → `messaging/inbound.handleInbound` → `replies.parseUpsert`/`parseIntent` (1/2/3) → IA `classify.ts` + `ai-policy.planAiReply` (só confirma sozinha com certeza alta) → `ackText`.
- Conversa: `store.ts` (`recordMessage`, `listConversation`, `markRead`, `listUnread`), `actions.ts`, `ChatSheet.tsx`, `ConversationHost.tsx` (`?conversa=<id>` abre por cima de qualquer tela).
- Sino: `features/notifications/core.ts` (`buildAvisos`: mensagens, não respondeu, pendências), `NotificationsSheet.tsx`, `components/nav/NotificationBell.tsx`.

## Dados
- `messages` (direction, kind, body, intent, external_id, read_at), `tenants.whatsapp_instance`, configs de IA em `tenants` (`ai_enabled`, `ai_rules`), `appointments.ai_handoff_at`.

## Ligações
- **Usa:** appointments (muda status), push (avisa a dona), reminders (textos/estado dos avisos), perfil (telefone comercial como sugestão ao conectar).
- **Usado por:** reminders e worker (porta de envio), appointments (mensagem de agendamento), clients (conversa), shell (estado na casca).

## Regras de negócio
- Cancelar/remarcar pela cliente = "quer remarcar" (`reschedule_requested`); horário segue reservado, a dona decide.
- Conectar: o campo do número vem com o telefone comercial do Meu perfil (`tenants.business_phone`), editável; Ajustes > WhatsApp lê e passa `profilePhone` ao `WhatsAppCard`.
- Textos educados, com primeiro nome. IA sempre ligada; por ora só lê e repassa.
- Sino/push só para: confirmou, pediu cancelar, pediu remarcar, não respondeu (e WhatsApp desconectado).

## Cuidados
- Webhook não é assinado pela Evolution: nunca exponha a URL nem mude a derivação do segredo sem reconfigurar as instâncias.
- Nunca logue texto de mensagem nem telefone completo.
- Erros da porta: 401/403/404 = `MessagingOfflineError` (reconectar); 400 = `MessagingRejectedError` (número recusado, não repetir; avulsa mostra `WHATSAPP_INVALID_NUMBER`); rede/5xx = `MessagingTransientError` (tentar de novo). Para log use `sendFailReason(e)`.
- Web e worker precisam de `EVOLUTION_URL` e `EVOLUTION_API_KEY`.
- Testes: `tests/db/whatsapp-inbound.test.ts`, `tests/e2e/mensagem.spec.ts`, `tests/unit/whatsapp-replies.test.ts`, `ai-policy.test.ts`, `evolution.test.ts`, `send-direct.test.ts`, `notifications.test.ts`.
