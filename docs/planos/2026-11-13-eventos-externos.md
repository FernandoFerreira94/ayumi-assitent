# Eventos de fora no calendário (Google e iPhone) · Plano de implementação

> Formato Superpowers (brainstorming → writing-plans → execução por tarefa com TDD).

**Objetivo:** a agenda mostra também os eventos que não são atendimentos (Google Agenda e Calendário do iPhone), em cinza com ícone, e o detalhe diz de onde veio. Em Ajustes, o "Calendário do iPhone" vira um interruptor que, ao ligar, abre o sheet de instruções que já existe.

## Decisões (brainstorming)

- **Google:** já é importado (`blocks.source='google'`, PR #57) e já aparece no dia. Muda só o visual (cinza + ícone `google`) e o detalhe (origem num círculo).
- **iPhone:** um PWA não lê o Calendário do iPhone. O caminho viável e simples é o **Calendário Público do iCloud**: no iPhone, Calendário › Calendários › (i) › "Calendário Público" › Compartilhar Link. Isso gera um link `webcal://pXX-caldav.icloud.com/published/2/...`, só leitura, que o app lê como ICS. Recusados: CalDAV com senha de app (pede senha específica do Apple ID, mais risco e trabalho) e Atalhos do iOS (frágil).
  - Trade-off de privacidade: quem tiver o link vê esse calendário. O sheet avisa. O link fica salvo só no banco, nunca em log.
- **Dados:** migration `0032_icloud_calendar.sql`: `tenants.icloud_calendar_url` e `blocks.external_uid` (único por estúdio), `blocks.source` ganha `'icloud'`. Eventos do iPhone são só leitura e ocupam horário, igual aos do Google.
- **ICS:** `ical.js` (Mozilla, sem dependências) para ler e expandir repetição (RRULE/EXDATE/RECURRENCE-ID) e fuso (TZID). Fazer isso à mão é arriscado. Ficam fora: dia inteiro, `TRANSP:TRANSPARENT`, `STATUS:CANCELLED`.
- **Sem duplicar:** fora os eventos com `UID` `@bubbly` (o nosso link assinado), os que batem início+fim com um evento do Google já importado ou com um atendimento do app.
- **Segurança (SSRF):** só `https`, host `*.icloud.com`, caminho `/published/`. Redirecionamento seguido à mão (máx. 3), revalidando o host. Timeout 10 s, limite de 2 MB.
- **Quando importa:** junto com o Google (`importExternalEvents`, no máximo a cada 2 min por estúdio), ao abrir o dia e as Vagas. Falha não apaga nada.
- **Ajustes:** cartão com `Switch` (padrão das Conexões). Ligar abre o sheet (link para o iPhone + trazer eventos do iPhone). Desligar pede confirmação e desliga as duas coisas.

## Tarefas

1. Migration + schema (`icloud_calendar_url`, `external_uid`, índice único parcial, GRANT).
2. `features/calendar-feed/icloud.ts` puro (TDD): `normalizeIcloudUrl`, `parseIcsEvents(text, from, to)`; `tests/unit/icloud.test.ts`.
3. `importIcloudEvents(tx, tenantId, events, from, to)` (TDD db): upsert por `external_uid`, apaga o que sumiu, dedup; `tests/db/icloud-import.test.ts`.
4. `fetchIcloudIcs` (redirect manual, timeout, limite) + `importExternalEvents` chama o iCloud.
5. Actions `saveIcloudCalendar(url)` (valida, testa, salva, importa) e `removeIcloudCalendar()`.
6. UI agenda: `source` no bloco; cinza + ícone; detalhe com origem num círculo.
7. Ajustes: `Switch` no cartão, sheet com a seção "Trazer eventos do iPhone".
8. Revisão: typecheck, lint, vitest, e2e do módulo, segurança; ficha `calendario-iphone.md` e `google.md`.
