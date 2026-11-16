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
- A3: `requireTenant` devolve `role` e `professionalId`.
- A6: telas/ações de equipe e permissões (`features/team/permissions.ts`).

## Agenda por profissional (migration 0037, task A2)
- `appointments`, `working_hours`, `slot_lists` ganham `professional_id` (NOT NULL); `blocks.professional_id` null = salão todo. Detalhes e cuidados em `agenda.md`.
- Sobreposição de horários por profissional; índices `(professional_id, starts_at)`.
- Trigger de default: insert sem profissional entra na primeira do salão (cria uma se não houver), então cadastro novo e testes antigos seguem sem passar profissional. Helper TS: `features/team/professional.ts` (`defaultProfessionalId`, `firstProfessionalId`).
- Backfill da 0037 cria profissional para salões criados depois da 0036 e liga as linhas existentes à primeira de cada salão.
