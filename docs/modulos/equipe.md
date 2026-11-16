# Equipe (profissionais e papéis)

**Finalidade:** quem atende no salão e o que cada login pode fazer. Individual = salão com 1 profissional; Empresa = várias. Plano em `docs/superpowers/plans/2026-11-15-pagamentos-planos-empresa.md` (Bloco A).

## Tabela e papéis (migration 0036)
- `professionals` (`tenant_id`, `display_name`, `color`, `active`, `position`, campos de calendário copiados de `tenants`: `calendar_token_hash`, `calendar_hide_names`, `icloud_calendar_url`). RLS `tenant_isolation`, como as demais. Pode não ter login.
- `memberships.professional_id` aponta para a profissional (null para quem não atende, como admin).
- `memberships.role`: `owner` | `admin` | `professional` (antigo `staff` virou `professional`).
- Uma pessoa, um salão: índice único `memberships(user_id)` (D6). Na migration, quem tinha 2 vínculos ficou com o de dono (senão o do salão mais antigo).
- Backfill: 1 profissional por salão com o nome da dona (`owner_name`, senão nome do usuário, senão nome do salão).

## Cuidados
- Campos de calendário continuam em `tenants` até a limpeza; hoje o app ainda lê de lá.
- Novo cadastro (`lib/auth.ts`) ainda não cria profissional; a trigger da 0037 cria a primeira ao agendar ou salvar expediente.

## Próximas tasks que estendem
- A6: telas/ações de equipe (convidar, trocar papel) e telas por papel.

## Agenda por profissional (migration 0037, task A2)
- `appointments`, `working_hours`, `slot_lists` ganham `professional_id` (NOT NULL); `blocks.professional_id` null = salão todo. Detalhes e cuidados em `agenda.md`.
- Sobreposição de horários por profissional; índices `(professional_id, starts_at)`.
- Trigger de default: insert sem profissional entra na primeira do salão (cria uma se não houver), então cadastro novo e testes antigos seguem sem passar profissional. Helper TS: `features/team/professional.ts` (`defaultProfessionalId`, `firstProfessionalId`).
- Backfill da 0037 cria profissional para salões criados depois da 0036 e liga as linhas existentes à primeira de cada salão.

## Permissões (task A3)
- `requireTenant()` devolve `{ userId, userName, tenantId, role, professionalId }`, lidos de `memberships` por `features/team/membership.ts` (`membershipOf`).
- `features/team/permissions.ts`: `can(role, action, { ownProfessionalId, targetProfessionalId })` pura; `canAs(actor, action, alvo?)` para as actions; `ownAgendaId(actor)` devolve a profissional do login só para o papel `professional` (owner/admin seguem a profissional padrão, como antes).
- Ações: `agenda.edit` (alvo = dona da agenda; null = salão todo), `clients.manage`, `services.manage`, `finance.salon`, `finance.own`, `salon.settings`, `billing.manage`, `salon.delete`.
- Matriz: owner tudo; admin tudo menos `billing.manage` e `salon.delete`; professional (D5) só `agenda.edit`/`finance.own` do próprio alvo e `clients.manage`.
- Erro de recusa: `FORBIDDEN` no catálogo.
- `features/team/guard.ts` (`mayEditAppointments`, `mayEditBlock`, `mayEditSlotList`) lê a dona do registro no banco, dentro do `withTenant`, nunca do input. Id inexistente passa e o core responde `NOT_ALLOWED`.
- Onde há checagem: agenda (criar/remarcar/editar/status/vários status/`retrySync`), bloqueios, expediente e listas de vagas (`agenda.edit`); despesas (`finance.salon`); serviços (`services.manage`); Ajustes do salão, WhatsApp, calendários, Google, mensagens, avisos de teste, localização, IA, exportar dados (`salon.settings`); excluir conta (`salon.delete`). Profissional que cria atendimento/bloqueio/expediente/lista grava na agenda dela.
- Sem checagem de propósito: clientes, conversa do WhatsApp, sino, push do próprio aparelho, leituras (agenda, vagas, calendário). Telas (`/financeiro`, `/ajustes/*`) ainda não escondem nada por papel: A6.
- Testes: `tests/unit/permissions.test.ts` (matriz) e `tests/db/professional-isolation.test.ts`.
