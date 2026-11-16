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
- Novo cadastro (`lib/auth.ts`) ainda não cria profissional; entra nas tasks seguintes do Bloco A.

## Próximas tasks que estendem
- A2: `professional_id` em appointments/blocks/working_hours/slot_lists e sobreposição por profissional.
- A3: `requireTenant` devolve `role` e `professionalId`.
- A6: telas/ações de equipe e permissões (`features/team/permissions.ts`).
