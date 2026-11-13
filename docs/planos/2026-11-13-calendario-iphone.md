# Calendário do iPhone (link assinado ICS) · Plano de implementação

> Formato Superpowers (brainstorming → writing-plans → execução por tarefa com TDD). Cada tarefa é pequena, testada e commitada.

**Objetivo:** os agendamentos aparecem no app Calendário do iPhone para os dois públicos: quem usa Google (já vê pelo Google Agenda) e quem usa só iCloud (assina um link `webcal://`).

**Arquitetura:** um token secreto por estúdio (só o hash SHA-256 fica em `tenants`). A rota pública `GET /api/calendar/<token>` acha o estúdio pelo hash e devolve um ICS (RFC 5545) gerado sem dependência nova, com os agendamentos de 30 dias atrás até 180 dias à frente. Em Ajustes > Conexões entra o cartão "Calendário do iPhone", que abre um sheet (vaul), sem página nova.

**Stack:** Next 16 (route handler), Drizzle/Postgres com RLS (`withTenant`), zod, vaul, vitest.

## Decisões (brainstorming)

- **Escolhido:** link assinado (só leitura). Recusados por ora: CalDAV (semanas, conflitos com a trava de horário) e `.ics` avulso (não acompanha as mudanças).
- **Dois públicos:** com o Google conectado, o sheet diz primeiro "você já vê pelo Google: adicione a conta Google no iPhone" e mostra o link só como opção ("use só um dos dois para não duplicar"). Sem Google, o link é o caminho principal.
- **Dados em `tenants`** (`calendar_token_hash`, `calendar_hide_names`), não numa tabela nova: há 1 link por estúdio, e a busca por hash roda como dono do banco (tenants não tem FORCE RLS, o mesmo padrão do webhook do WhatsApp). Depois a leitura dos agendamentos passa por `withTenant` (RLS).
- **Token:** 32 bytes aleatórios em base64url. O link só aparece ao gerar. "Gerar novo link" troca o hash, e o link antigo dá 404 na hora. "Desligar" apaga o hash.
- **Privacidade:** a opção "Ocultar nome da cliente" deixa o título como "Atendimento · Serviço". Por padrão o título é "Primeiro nome · Serviço". O telefone nunca vai no feed. O valor e a observação também ficam de fora.
- **Conteúdo:** os agendamentos fora `cancelled`. O status entra no título quando for pendente ("(a confirmar)") ou um pedido de remarcar. `UID = <id>@bubbly`, então uma edição atualiza o evento em vez de duplicar. Eventos importados do Google (blocks `source='google'`) ficam fora. Bloqueios do app entram como "Bloqueado".
- **Atualização:** `REFRESH-INTERVAL;VALUE=DURATION:PT15M` e `X-PUBLISHED-TTL:PT15M`. O iOS decide de verdade (o "Obter dados" dele, entre 15 min e 1 h). Isso fica dito no sheet.
- **Segurança:** a resposta sai com `Cache-Control: private, no-store` e `X-Robots-Tag: noindex`. O formato do token é validado antes de ir ao banco. 404 único para token inválido ou revogado. Nada do token é logado. O proxy já deixa `/api` fora da sessão.

## Tarefas

### 1. Migration + schema

- Criar `src/db/migrations/0031_calendar_feed.sql`: `ALTER TABLE tenants ADD calendar_token_hash text UNIQUE, ADD calendar_hide_names boolean NOT NULL DEFAULT false; GRANT UPDATE (calendar_token_hash, calendar_hide_names) ON tenants TO app_user;`
- `src/db/schema.ts`: as duas colunas em `tenants`.

### 2. Gerador ICS puro (TDD)

- Teste `tests/unit/ics.test.ts`: escape de `,;\` e quebra de linha, dobra de linha em 75 octetos, CRLF, datas em UTC (`YYYYMMDDTHHMMSSZ`), título com e sem nome, pendente, bloqueio.
- `src/features/calendar-feed/ics.ts`: `buildIcs({ calName, events })` e `eventTitle(...)`.

### 3. Token (TDD)

- Teste `tests/unit/calendar-token.test.ts`: o token gerado tem 43 caracteres base64url, o hash é determinístico e o formato inválido é recusado.
- `src/features/calendar-feed/token.ts`: `newToken()`, `hashToken()`, `isTokenShape()` com `node:crypto`.

### 4. Leitura e rota

- `src/features/calendar-feed/server.ts`: `tenantByToken(hash)` e `feedEvents(tenantId, now)` (com `withTenant`: agendamentos via `serviceLabel` e bloqueios `source='app'` na janela).
- `src/app/api/calendar/[token]/route.ts`: GET que devolve `text/calendar; charset=utf-8`. O link termina em `.ics` (o iOS aceita os dois), e a rota tira o `.ics` do token.

### 5. Ações e UI

- `src/features/calendar-feed/actions.ts`: `calendarFeedStatus()`, `createCalendarLink()` (gera ou troca e devolve a URL uma vez), `disableCalendarLink()`, `setCalendarHideNames(bool)`. Base da URL: `BETTER_AUTH_URL`.
- `src/features/calendar-feed/IphoneCalendarCard.tsx`: cartão (TileTitle "Calendário do iPhone") + sheet com: aviso do Google quando conectado, "Adicionar ao iPhone" (`webcal://`), Copiar link, passo a passo manual (Ajustes > Calendário > Contas > Adicionar Conta > Outra > Adicionar Calendário Assinado), Ocultar nome (Switch), Gerar novo link, Desligar. Estados de loading, erro e sucesso por toast. Sem input de texto (regra do teclado não se aplica).
- `src/app/(app)/ajustes/page.tsx`: seção `#iphone` logo abaixo do Google.

### 6. Fechamento

- Ficha `docs/modulos/google.md` (ou uma nova `calendario-iphone.md` + README), novidade em `features/update/changelog.ts`.
- Lint, typecheck, vitest. PR → CI → merge. Avisar: rodar a migration 0031 e fazer Redeploy do web.

## Riscos

- O iOS pode demorar mais de 1 h para atualizar. Isso é aceito e fica dito no sheet.
- Um link vazado expõe o primeiro nome e o serviço. Mitigação: o link pode ser trocado e o nome pode ser ocultado.
- Quem ativar o Google e o link vê tudo duplicado. Mitigação: o aviso no sheet.
