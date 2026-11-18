# Google (login, Agenda, Contatos)

**Finalidade:** login com Google, espelhar cada agendamento no Google Agenda da profissional do atendimento (a cliente com e-mail recebe convite) e trazer os eventos do Google como horário ocupado. Também fornece o token para importar Google Contatos.

## Arquivos
- `features/google/server.ts`: `professionalGoogleAccount(professionalId)` (conta Google do login ligado à profissional; dona sem vínculo vale pela padrão), `googleAccessToken(professionalId)`, `calendarForProfessional`, `syncAppointmentSafe(tenantId, appointmentId)` (lê a profissional do próprio atendimento; nunca derruba o agendamento; sem Google dela devolve `skipped`), `isGoogleConnected(professionalId)`, `connectedProfessionalIds(tenantId)`, `importExternalEvents(tenantId)` (uma importação por profissional conectada).
- `calendar.ts`: cliente REST mínimo (`fetch` injetável), `refreshAccessToken`, `toExternalEvent`.
- `sync.ts` (`syncAppointment`: cancelado apaga o evento), `import.ts` (`importGoogleEvents(tx, tenantId, professionalId, …)`: janela `[from, to)` vira `blocks.source='google'` da profissional, ignora eventos criados pelo app; a limpeza só mexe nos blocos dela e nos antigos sem profissional, que ela adota).
- UI: `GoogleCard.tsx` (`/ajustes/calendarios`; volta do OAuth cai lá), `RetrySyncButton.tsx`, `actions.disconnectGoogle` (apaga o Google do login ligado à profissional do usuário logado)/`retrySync`.
- Desconectar com o Google como única entrada: `disconnectGoogle` devolve `VALIDATION`; o card troca o aviso por "Crie uma senha antes de desconectar" + botão que abre `CreatePasswordSheet.tsx` → `actions.createPassword` (Better Auth `setPassword`, cria a conta `credential`). Depois o desconectar funciona e o login vira e-mail + senha. No sheet, o botão Criar senha só libera quando as duas senhas batem e têm o mínimo (`lib/password.ts` `passwordPairState`, mesmo `PASSWORD_MIN` do zod); aviso vermelho/verde com `aria-live`. Testes: `tests/unit/google-create-password.test.ts`, `tests/unit/password-pair.test.tsx`. Aviso de falha: `appointments/sync-warning.ts`.
- Auth: `lib/auth.ts` (Better Auth, escopos Google), `lib/auth-client.ts`.

## Dados
- Tokens nas tabelas do Better Auth (`account`, migration `0002_auth.sql`), `appointments.google_event_id`, `blocks` com `source='google'`.

## Ligações
- **Usa:** appointments.
- **Usado por:** appointments (sync ao criar/editar/status; import ao abrir o dia), vagas (import antes de calcular), contacts (token da profissional do login), shell/Ajustes, pendências (`listPendencias` recebe os ids das profissionais conectadas: só os atendimentos delas entram em "não chegou ao Google").

## Cuidados
- OAuth em modo Teste: só e-mails de teste entram; `ALLOWED_EMAILS` libera o app.
- Problema conhecido: "Google Agenda pedindo reconectar sempre" (investigar refresh/escopo em `calendar.refreshAccessToken` e `server.googleAccessToken`).
- Testes: `tests/unit/google-calendar.test.ts`, `google-import.test.ts`, `tests/db/google-professional.test.ts` (conta Google por profissional, sem login não sincroniza, import por profissional).
- Evento do Google é só leitura no app; nunca identificar cliente pelo título.
- Tokens do Google ficam **cifrados** (`account.encryptOAuthTokens`). Leitura/escrita direta por SQL passa por `features/google/token-crypto.ts` (`readToken`/`writeToken`); linha antiga em texto puro continua valendo. Desconectar revoga no Google (`calendar.revokeToken`) antes de apagar.
- Por profissional (A4): o mesmo evento do Google em duas contas do mesmo salão não é suportado (índice único `blocks(tenant_id, google_event_id)`); o bloco fica com quem importou primeiro. Trocar o índice para `(professional_id, …)` pede migration.
- `connectedProfessionalIds`/`professionalGoogleAccount` leem `professionals` como dono do banco só para achar a padrão (precisa de papel que ignora RLS, como retenção e exclusão de conta).
