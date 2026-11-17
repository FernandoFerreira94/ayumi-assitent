# WhatsApp, conversas e sino

**Finalidade:** ligar o número do estúdio (Evolution API, código de pareamento), mandar mensagens (agendamento, lembretes, avulsas), receber respostas, deixar a IA ler o texto livre da cliente e avisar a dona pelo sino e push.

## Arquivos
- Conexão: `features/whatsapp/core.ts` (`instanceName` = `studio-<id>`, `startPairing`, `currentState`), `webhook.ts` (garante webhook na instância), `actions.ts`, `WhatsAppCard.tsx`, `QrImage.tsx`, `pairing-guide.tsx` (3 passos ilustrados do código de pareamento, versão iPhone e Android; o sistema vem de `install/platform.detectPlatform` e a dona troca no seletor iPhone|Android, pois o WhatsApp do estúdio pode estar em outro celular; o passo 3 mostra o código real nas caixas). Admin Evolution: `messaging/evolution-admin.ts`.
- Envio: `messaging/port.ts` (porta), `evolution.ts` (implementação, `messagingForInstance`), `send.ts` (avulsa), `booking-send.ts` (`sent`/`failed`/`skipped`; põe o link do convite .ics, ver `agenda.md`).
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
- Webhook não é assinado pela Evolution: o token da URL é **por instância** (`HMAC(BETTER_AUTH_SECRET, "whatsapp-webhook:<instância>")`) e a rota só aceita se bater com o `instance` do corpo. O worker reaponta todas as instâncias ao iniciar. O token antigo (único) ainda é aceito com log `whatsapp_webhook_legacy`: remover `isLegacyWebhookToken` depois de um deploy do worker. Trocar o `BETTER_AUTH_SECRET` troca todos os tokens (reiniciar o worker reaponta).
- Nunca logue texto de mensagem nem telefone completo.
- Erros da porta: 401/403/404 = `MessagingOfflineError` (reconectar); 400 = `MessagingRejectedError` (número recusado, não repetir; avulsa mostra `WHATSAPP_INVALID_NUMBER`); rede/5xx = `MessagingTransientError` (tentar de novo). Para log use `sendFailReason(e)`.
- Web e worker precisam de `EVOLUTION_URL` e `EVOLUTION_API_KEY`.
- Testes: `tests/db/whatsapp-inbound.test.ts`, `tests/e2e/mensagem.spec.ts`, `tests/unit/whatsapp-replies.test.ts`, `ai-policy.test.ts`, `evolution.test.ts`, `send-direct.test.ts`, `notifications.test.ts`.
- SAIR/VOLTAR no webhook: ver `lembretes.md` (opt-out). Cartão da cliente mostra "Não recebe lembretes automáticos".
- Limites (`messaging/quota.ts`): 150 mensagens manuais por dia por estúdio (`sendClientMessage` → `RATE_LIMITED`); texto da cliente para a IA cortado em 500 caracteres e regras da dona em 1.000. Constantes viram limite por plano na cobrança.

## Limites da IA nas respostas (`messaging/ai-policy.ts`, 17/11)
- Só aplica a intenção sozinha com confiança ≥ 0,9 (`AI_MIN_CONFIDENCE`); abaixo disso, atraso ou "outro assunto" passa para a profissional (`handoff`).
- Dona escreveu para a cliente nas últimas 12 h (`OWNER_QUIET_HOURS`): a IA fica quieta.
- No máximo 3 respostas automáticas por cliente em 24 h (`AI_MAX_REPLIES_24H`); correção de intenção vale por 2 h (`CORRECTION_HOURS`).
- Mídia ou texto acima de 1.000 caracteres (`AI_MAX_CHARS`) vai direto para a dona, sem chamar o modelo.
- Mapeamento: 1 = confirma (`confirmed`); 2 = cancelar e 3 = remarcar viram `reschedule_requested` (nunca cancela sozinho). O número só vale sozinho ("2", "opção 2").
- Dívida: texto de 501 a 1.000 caracteres chega ao modelo cortado em 500 (`quota.AI_TEXT_MAX`), então a IA pode decidir com metade da mensagem. Alinhar os dois limites.
