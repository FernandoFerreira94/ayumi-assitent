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
- Webhook não é assinado pela Evolution: o token da URL é **por instância** (`HMAC(BETTER_AUTH_SECRET, "whatsapp-webhook:<instância>")`) e a rota só aceita se bater com o `instance` do corpo. O worker reaponta todas as instâncias ao iniciar. O token antigo (único para todas) foi removido em 17/11: sem token da própria instância, 401. Trocar o `BETTER_AUTH_SECRET` troca todos os tokens (reiniciar o worker reaponta).
- Nunca logue texto de mensagem nem telefone completo.
- Erros da porta: 401/403/404 = `MessagingOfflineError` (reconectar); 400 = `MessagingRejectedError` (número recusado, não repetir; avulsa mostra `WHATSAPP_INVALID_NUMBER`); rede/5xx = `MessagingTransientError` (tentar de novo). Para log use `sendFailReason(e)`.
- Web e worker precisam de `EVOLUTION_URL` e `EVOLUTION_API_KEY`.
- Testes: `tests/db/whatsapp-inbound.test.ts`, `tests/e2e/mensagem.spec.ts`, `tests/unit/whatsapp-replies.test.ts`, `ai-policy.test.ts`, `evolution.test.ts`, `send-direct.test.ts`, `notifications.test.ts`.
- SAIR/VOLTAR no webhook: ver `lembretes.md` (opt-out). Cartão da cliente mostra "Não recebe lembretes automáticos".
- Limites (`messaging/quota.ts`): 150 mensagens manuais por dia por estúdio (`sendClientMessage` → `RATE_LIMITED`); texto da cliente para a IA cortado em 500 caracteres e regras da dona em 1.000. Constantes viram limite por plano na cobrança.

## Silêncio por padrão (23/11, casos reais)

Regra do produto: **o sistema só informa a cliente; a única conversa dele é pedir a confirmação do horário.** A dona fala direto com as clientes, então qualquer outra mensagem é conversa dela.

- **Pergunta em aberto:** lembrete (1º ou 2º) ou aviso de remarcação (gravados como `kind = reminder`). A mensagem da cliente só é tratada como resposta se chegou até **12 h** depois da pergunta (`ANSWER_WINDOW_HOURS`), antes do horário, e tem cara de resposta (até 200 caracteres e 3 linhas, `looksLikeAnswer`). Lista, recado longo ou mensagem fora da janela = conversa: nada automático, só aparece na conversa.
- **Citação:** resposta citando uma mensagem vale pela mensagem citada (`quotedAppointment`). Citar a confirmação, a conversa da dona ou lembrete de horário já remarcado = conversa.
- **Dois lembretes em aberto sem citação:** não escolhe; push "tem mais de um horário em aberto".
- **Única resposta automática:** o agradecimento de confirmar (1, "ok", "sim" claros, ou IA com certeza ≥ 0,9) e o "recebi seu pedido" de 2/3. Não existe mais "não entendi, passei para a profissional" nem "não consigo ouvir áudios".
- **Cancelar/remarcar só pelo número 2 ou 3.** Texto livre (regra ou IA) não muda nada e não responde; push "parece querer cancelar/remarcar".
- **Não entendeu, mas parece resposta** (curta, logo após a pergunta, ou áudio/foto): nada para a cliente; push "precisa de você" uma vez por pergunta (`ai_handoff_at`).
- **Depois de respondido:** por 2 h só o número troca a resposta ("ops, é 3"); o resto é conversa.
- Dona escreveu depois da pergunta (`ownerWroteSince`, #193): tudo vira conversa. Dona escreveu nas últimas 12 h: IA nem é chamada.
- O status só muda se o horário e o status continuam iguais aos de quando a mensagem foi lida.
- "Não dá / não posso / não vai dar" soltos só contam se a mensagem for só a recusa.
- Chamada ao modelo (`classify.ts`): Haiku 5.5 com raciocínio desligado; loga `classify_reply` (intenção + confiança) ou `classify_reply_unparsed`, nunca o texto. Problema com link/endereço/pagamento = `other`. Mudou aqui: Redeploy do **web** (o webhook roda no web).
- Limites: no máximo 3 respostas automáticas por cliente em 24 h; texto acima de 1.000 caracteres nem vai ao modelo.
- Regras fixas (`replies.parseIntent`): o sim só vale se a mensagem for o sim e nada mais (cortesia pode vir junto); pergunta sobre cancelar não é pedido. O número só vale sozinho ("2", "opção 2").
- Mapeamento: 1 = confirma (`confirmed`); 2 = cancelar e 3 = remarcar viram `reschedule_requested` (nunca cancela sozinho). O número só vale sozinho ("2", "opção 2").

## Respostas não entendidas (23/11)
- Tabela `unclear_replies` (migration `0057`, RLS por salão; `app_user` só lê, grava e apaga). Guarda só **possível resposta** que não virou ação: alvo dentro da janela de 12 h (ou 2+ lembretes abertos), sem mídia, `looksLikeAnswer`, e a dona sem escrever à cliente. Campos: cliente por id (nunca telefone), agendamento, texto (≤500), palpite e certeza da IA, `decision` (`alerted`/`silent`/`guess`/`ambiguous`), `label`.
- Gravação: `messaging/unclear.recordUnclear` no fim do `handleInbound`; usa savepoint e nunca lança (log `unclear_record_failed`, sem texto).
- Apaga: 90 dias (`retention/run.ts`, `unclear`), cliente excluída/anonimizada (`clients/core.deleteClientRow`), conta (cascade do salão).
- Tela do dono: `/admin/respostas` (ver `admin.md`). Rótulos viram exemplos de regra e casos de teste; nada treina modelo. Política de privacidade (seções 3, 5 e 7) cita isso.
