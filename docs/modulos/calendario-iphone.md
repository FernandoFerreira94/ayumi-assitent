# Calendário do iPhone (link assinado ICS)

**Finalidade:** mostrar os agendamentos no app Calendário do iPhone para quem usa só iCloud. Funciona por um link `webcal://` assinado, só de leitura, que o iOS atualiza sozinho (de 15 min a 1 h, quem decide é o iOS). Quem usa Google já vê pelo Google Agenda, e o sheet avisa para não usar os dois, senão os eventos aparecem duplicados.

## Arquivos

- `features/calendar-feed/ics.ts`: `buildIcs`, `eventTitle`, `escapeText`, `foldLine` (RFC 5545, sem dependência).
- `token.ts`: `newToken` (32 bytes base64url), `hashToken` (SHA-256), `isTokenShape`.
- `server.ts`: `tenantByTokenHash` (como dono do banco: tenants sem FORCE RLS) e `feedIcs` (via `withTenant`; janela de 30 dias atrás a 180 à frente).
- `actions.ts`: `createCalendarLink` (gera ou troca e devolve a URL só nessa hora), `disableCalendarLink`, `setCalendarHideNames`.
- Rota `app/api/calendar/[token]/route.ts` (aceita `<token>.ics`; dá 404 igual para inválido, trocado ou desligado; `no-store`, `noindex`; nunca loga o token).
- UI: `IphoneCalendarCard.tsx` (Ajustes > Conexões, `#iphone`), sheet vaul com passo a passo.

## Dados

- `tenants.calendar_token_hash` (unique, null = desligado) e `tenants.calendar_hide_names` (migration `0031_calendar_feed.sql`).

## Regras

- Entram os agendamentos não cancelados e os bloqueios `source='app'`. Ficam fora os eventos importados do Google, o telefone, o valor e a observação.
- Título: "Primeiro nome · Serviço" ou "Atendimento · Serviço" (nome oculto), com "(a confirmar)" ou "(pediu para remarcar)". `UID = <id>@bubbly`, assim uma edição atualiza o evento sem duplicar.
- Link vazado: "Gerar link novo" invalida o anterior na hora.

## Ligações

- **Usa:** appointments (`serviceLabel`), blocks, clients, services, google (só `isGoogleConnected` na página, para o aviso).
- **Usado por:** Ajustes.

## Testes

- `tests/unit/ics.test.ts`, `tests/db/calendar-feed.test.ts` (isolamento por estúdio, cancelados e Google fora, nome oculto).
