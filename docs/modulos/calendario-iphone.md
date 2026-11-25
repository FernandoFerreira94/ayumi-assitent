# Calendário do iPhone (link assinado ICS + leitura do iCloud)

**Duas direções, cada uma liga separado** (Ajustes > Calendários, interruptor que abre o sheet):
1. **iPhone → app (PR eventos externos, 13/11):** lê um calendário do iCloud com "Calendário Público" ligado (link `webcal://pXX-caldav.icloud.com/published/...`, só leitura). Os eventos entram como `blocks.source='icloud'` (cinza, ocupam horário). Título com nome de cliente cadastrada mostra "Parece um atendimento" + **Transformar em agendamento**.
2. **app → iPhone (#115):** o link assinado abaixo.

**Finalidade (direção 2):** mostrar os agendamentos no app Calendário do iPhone para quem usa só iCloud. Funciona por um link `webcal://` assinado, só de leitura, que o iOS atualiza sozinho (de 15 min a 1 h, quem decide é o iOS). Quem usa Google já vê pelo Google Agenda, e o sheet avisa para não usar os dois, senão os eventos aparecem duplicados.

## Arquivos

- `features/calendar-feed/ics.ts`: `buildIcs`, `eventTitle`, `escapeText` (tira caractere de controle), `calNameText`, `foldLine` (RFC 5545, sem dependência). Horários em UTC (`Z`), sem VTIMEZONE; sem LAST-MODIFIED (não temos `updated_at`).
- `token.ts`: `newToken` (32 bytes base64url), `hashToken` (SHA-256), `isTokenShape`.
- `server.ts`: `tenantByTokenHash` (como dono do banco: tenants sem FORCE RLS) e `feedIcs` (via `withTenant`; janela de 30 dias atrás a 180 à frente).
- `actions.ts`: `createCalendarLink` (gera ou troca e devolve a URL só nessa hora), `disableCalendarLink`, `setCalendarHideNames`.
- Rota `app/api/calendar/[token]/route.ts` (aceita `<token>.ics`; dá 404 igual para inválido, trocado ou desligado; `no-store`, `noindex`; nunca loga o token).
- UI: `IphoneCalendarCard.tsx` (`/ajustes/calendarios#iphone`), sheet vaul com **abas por direção** ("Trazer do iPhone" = direção 1, "Ver no iPhone" = direção 2; ponto verde = ligada). Abre na aba ligada; sem nada ligado, em "Trazer do iPhone". Cada aba: desenho de origem → destino (`Flow`), passos curtos coloridos (`Steps`: feito verde, agora roxo) e um botão principal por estado. Direção 2: "Criar link" → "Adicionar ao iPhone" (webcal) → **"Assinado no iPhone"** (passo 3 verde) quando o iPhone lê o link pela 1ª vez: a rota grava `tenants.calendar_fetched_at` (`server.markCalendarFetched`, no máximo a cada 10 min; migration 0046), link novo/desligar zera, e o sheet pergunta `actions.calendarLinkStatus` a cada 4 s com o sheet aberto (até 15 min) e na volta ao app, além do botão "Já assinei" + "Copiar link" (vira "Copiado ✓"); caminho manual em pílulas dentro de "Não abriu?". Direção 1: passo a passo ilustrado `icloud-guide.tsx` (`ICLOUD_STEPS` no `StepGuide`), "Abrir o Calendário" (`calshow:`, só iOS via `install/platform.detectPlatform`), botão **Colar** no campo (`clipboard.readText`; link válido liga na hora) e erro curto embaixo do campo além do toast.

## Leitura do iCloud (direção 1)

- `icloud-url.ts` (puro, sem dependência, usado também no sheet) + `icloud.ts` (reexporta): `normalizeIcloudUrl`/`isIcloudUrl` (só https, `*.icloud.com`, `/published/`: anti-SSRF), `parseIcsEvents` com `ical.js` (RRULE, EXDATE, RECURRENCE-ID, VTIMEZONE; hora sem fuso = UTC-3). Fora: dia inteiro, cancelado, TRANSPARENT, UID `@bubbly` (o nosso link). Teto 3000 eventos.
- **Vários calendários (0061, 25/11):** um link por calendário em `icloud_calendars` (nome lido de `X-WR-CALNAME` por `icsCalendarName`, `event_count`, `synced_at`, `sync_error`; até 10 por estúdio; FORCE RLS). `blocks.icloud_calendar_id` (cascade): cada calendário só refaz/apaga os seus. No sheet: lista com nome + "Lido às HH:MM · N eventos na agenda" ou o erro em vermelho (`icloud-view.ts`), "Tirar" por calendário e "Adicionar outro calendário". Colar o mesmo link de novo só relê. `tenants.icloud_calendar_url` ficou sem uso (remover depois).
- `icloud-server.ts`: `fetchIcloudIcs` (redirect manual revalidando host, 10 s, 2 MB), `readIcloud` (rede + ICS, sem banco), `storeIcloudRead`, `listIcloudCalendars`, `importIcloudCalendar` (lê todos; um com erro não segura os outros) (chamado via `blocks/external-sync.syncExternalCalendars` em `DaySchedule`, Vagas e no layout do Calendário, junto com o Google; no máximo a cada 2 min por estúdio; nunca lança, loga só o tipo do erro).
- Repetição: o iCloud expande RRULE/EXDATE/RECURRENCE-ID na janela (14 dias atrás a 180 à frente, uma linha por ocorrência); o Google usa `singleEvents=true` (mesma janela). Os dois aparecem cinza também no **mês** do Calendário (`calendar/data.ts`).
- `icloud-import.ts`: `importIcloudEvents` (upsert por `external_uid`; não duplica atendimento nem evento do Google com mesmo início+fim; apaga o que sumiu na janela, exceto os convertidos), `clearIcloudEvents`.
- `match.ts`: `guessAppointment(título, clientes, serviços)`: nome completo, ou primeiro nome se for único; palavra inteira, sem acento; serviço mais longo primeiro. Sem cliente = "outro evento". IA (Haiku) para ambíguos ficou para depois.
- Conversão: `createAppointment` com `fromBlockId` → `blocks/core.convertExternalBlock` (marca `converted_at`, na mesma transação; se o agendamento falhar, desfaz). Bloco convertido sai de `listBlocks`/`overlapsBlock`. Vale para Google e iCloud; o detalhe pede para apagar o evento original.
- Actions: `saveIcloudCalendar` (lê uma vez antes de salvar; devolve nome e nº de eventos), `removeIcloudCalendar(id?)` (sem id = todos).
- O link do iCloud nunca vai para a tela (só um booleano) nem para log.

## Dados

- `tenants.calendar_token_hash` (unique, null = desligado) e `tenants.calendar_hide_names` (migration `0031_calendar_feed.sql`).
- `blocks.external_uid` (único por estúdio), `blocks.converted_at`, check de `blocks.source` com `'icloud'` (migration `0032_icloud_calendar.sql`).
- `icloud_calendars` + `blocks.icloud_calendar_id` (migration `0061_icloud_calendars.sql`, levou o link antigo de `tenants.icloud_calendar_url`).

## Regras

- Entram os agendamentos não cancelados e os bloqueios `source='app'`. Ficam fora os eventos importados do Google, o telefone, o valor e a observação.
- Título: "Primeiro nome · Serviço" ou "Atendimento · Serviço" (nome oculto), com "(a confirmar)", "(pediu para remarcar)" ou "(faltou)". Nome do calendário sem `, ; \` (nem todo leitor desfaz o escape). `UID = <id>@bubbly`, assim uma edição atualiza o evento sem duplicar.
- Link vazado: "Gerar link novo" invalida o anterior na hora.
- Token nunca em log nem Sentry: `redactUrl` (`lib/log.ts`) limpa `/api/calendar/<token>` e `?token=` no `onRequestError` e no `beforeSend`/`beforeSendTransaction` do Sentry. O log HTTP do próprio Railway ainda mostra o caminho (só o dono vê).
- Sem rate limit: token de 256 bits não é adivinhável e cada pedido são 2 consultas por índice.

## Ligações

- **Usa:** appointments (`serviceLabel`), blocks, clients, services, google (só `isGoogleConnected` na página, para o aviso).
- **Usado por:** Ajustes.

## Testes

- `tests/unit/icloud.test.ts`, `icloud-fetch.test.ts`, `event-match.test.ts`, `tests/db/icloud-import.test.ts`, `tests/e2e/eventos-externos.spec.ts`.
- `tests/unit/ics.test.ts`, `tests/unit/redact-url.test.ts`, `tests/db/calendar-feed.test.ts` (isolamento por estúdio, cancelados e Google fora, nome oculto, link trocado/desligado), `tests/e2e/calendario-iphone.spec.ts` (sheet ponta a ponta: criar, trocar, ocultar, desligar).
