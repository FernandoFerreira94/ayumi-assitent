# Google (login, Agenda, Contatos)

**Finalidade:** login com Google, espelhar cada agendamento no Google Agenda da dona (a cliente com e-mail recebe convite) e trazer os eventos do Google como horário ocupado. Também fornece o token para importar Google Contatos.

## Arquivos
- `features/google/server.ts`: `googleAccessToken`, `calendarForTenant`, `syncAppointmentSafe` (nunca derruba o agendamento), `isGoogleConnected`, `importExternalEvents`.
- `calendar.ts`: cliente REST mínimo (`fetch` injetável), `refreshAccessToken`, `toExternalEvent`.
- `sync.ts` (`syncAppointment`: cancelado apaga o evento), `import.ts` (`importGoogleEvents`: janela `[from, to)` vira `blocks.source='google'`, ignora eventos criados pelo app).
- UI: `GoogleCard.tsx` (Ajustes > Conexões), `RetrySyncButton.tsx`, `actions.disconnectGoogle`/`retrySync`. Aviso de falha: `appointments/sync-warning.ts`.
- Auth: `lib/auth.ts` (Better Auth, escopos Google), `lib/auth-client.ts`.

## Dados
- Tokens nas tabelas do Better Auth (`account`, migration `0002_auth.sql`), `appointments.google_event_id`, `blocks` com `source='google'`.

## Ligações
- **Usa:** appointments.
- **Usado por:** appointments (sync ao criar/editar/status; import ao abrir o dia), vagas (import antes de calcular), contacts (token), shell/Ajustes.

## Cuidados
- OAuth em modo Teste: só e-mails de teste entram; `ALLOWED_EMAILS` libera o app.
- Problema conhecido: "Google Agenda pedindo reconectar sempre" (investigar refresh/escopo em `calendar.refreshAccessToken` e `server.googleAccessToken`).
- Testes: `tests/unit/google-calendar.test.ts`, `google-import.test.ts`.
- Evento do Google é só leitura no app; nunca identificar cliente pelo título.
