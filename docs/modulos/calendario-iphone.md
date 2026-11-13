# Calendário do iPhone (link assinado ICS)

**Finalidade:** mostrar os agendamentos no app Calendário do iPhone para quem usa só iCloud. Funciona por um link `webcal://` assinado, só de leitura, que o iOS atualiza sozinho (de 15 min a 1 h, quem decide é o iOS). Quem usa Google já vê pelo Google Agenda, e o sheet avisa para não usar os dois, senão os eventos aparecem duplicados.

## Arquivos

- `features/calendar-feed/ics.ts`: `buildIcs`, `eventTitle`, `escapeText` (tira caractere de controle), `calNameText`, `foldLine` (RFC 5545, sem dependência). Horários em UTC (`Z`), sem VTIMEZONE; sem LAST-MODIFIED (não temos `updated_at`).
- `token.ts`: `newToken` (32 bytes base64url), `hashToken` (SHA-256), `isTokenShape`.
- `server.ts`: `tenantByTokenHash` (como dono do banco: tenants sem FORCE RLS) e `feedIcs` (via `withTenant`; janela de 30 dias atrás a 180 à frente).
- `actions.ts`: `createCalendarLink` (gera ou troca e devolve a URL só nessa hora), `disableCalendarLink`, `setCalendarHideNames`.
- Rota `app/api/calendar/[token]/route.ts` (aceita `<token>.ics`; dá 404 igual para inválido, trocado ou desligado; `no-store`, `noindex`; nunca loga o token).
- UI: `IphoneCalendarCard.tsx` (Ajustes > Conexões, `#iphone`), sheet vaul com passo a passo.

## Dados

- `tenants.calendar_token_hash` (unique, null = desligado) e `tenants.calendar_hide_names` (migration `0031_calendar_feed.sql`).

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

- `tests/unit/ics.test.ts`, `tests/unit/redact-url.test.ts`, `tests/db/calendar-feed.test.ts` (isolamento por estúdio, cancelados e Google fora, nome oculto, link trocado/desligado), `tests/e2e/calendario-iphone.spec.ts` (sheet ponta a ponta: criar, trocar, ocultar, desligar).
