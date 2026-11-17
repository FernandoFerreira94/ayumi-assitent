# Equipe (profissionais e papéis)

**Finalidade:** quem atende no salão e o que cada login pode fazer. Individual = salão com 1 profissional; Empresa = várias. Plano em `docs/superpowers/plans/2026-11-15-pagamentos-planos-empresa.md` (Bloco A).

## Tabela e papéis (migration 0036)
- `professionals` (`tenant_id`, `display_name`, `color`, `active`, `position`, campos de calendário copiados de `tenants`: `calendar_token_hash`, `calendar_hide_names`, `icloud_calendar_url`). RLS `tenant_isolation`, como as demais. Pode não ter login.
- `memberships.professional_id` aponta para a profissional (null para quem não atende, como admin).
- `memberships.role`: `owner` | `admin` | `professional` (antigo `staff` virou `professional`).
- Uma pessoa, um salão: índice único `memberships(user_id)` (D6). Na migration, quem tinha 2 vínculos ficou com o de dono (senão o do salão mais antigo).
- Backfill: 1 profissional por salão com o nome da dona (`owner_name`, senão nome do usuário, senão nome do salão).

## Cuidados
- Campos de calendário continuam em `tenants` só até a limpeza; desde a A4 o app lê e grava em `professionals` (as colunas de `tenants` ficam paradas, sem uso).
- Novo cadastro (`lib/auth.ts`) ainda não cria profissional; a trigger da 0037 cria a primeira ao agendar ou salvar expediente.

## Próximas tasks que estendem
- Trocar o papel de quem já entrou (hoje só se convida; sem tela para mudar) e o limite de assentos (B7, ponto de ligação `assertSeatAvailable` em `features/team/core.ts`).

## Agenda por profissional (migration 0037, task A2)
- `appointments`, `working_hours`, `slot_lists` ganham `professional_id` (NOT NULL); `blocks.professional_id` null = salão todo. Detalhes e cuidados em `agenda.md`.
- Sobreposição de horários por profissional; índices `(professional_id, starts_at)`.
- Trigger de default: insert sem profissional entra na primeira do salão (cria uma se não houver), então cadastro novo e testes antigos seguem sem passar profissional. Helper TS: `features/team/professional.ts` (`defaultProfessionalId`, `firstProfessionalId`).
- Backfill da 0037 cria profissional para salões criados depois da 0036 e liga as linhas existentes à primeira de cada salão.

## Permissões (task A3)
- `requireTenant()` devolve `{ userId, userName, tenantId, role, professionalId }`, lidos de `memberships` por `features/team/membership.ts` (`membershipOf`).
- `features/team/permissions.ts`: `can(role, action, { ownProfessionalId, targetProfessionalId })` pura; `canAs(actor, action, alvo?)` para as actions; `ownAgendaId(actor)` devolve a profissional do login só para o papel `professional` (owner/admin seguem a profissional padrão, como antes).
- Ações: `agenda.edit` (alvo = dona da agenda; null = salão todo), `clients.manage`, `services.manage`, `finance.salon`, `finance.own`, `salon.settings`, `calendar.own`, `team.manage`, `billing.manage`, `salon.delete`.
- Matriz: owner tudo; admin tudo menos `billing.manage` e `salon.delete`; professional (D5) só `agenda.edit`/`finance.own` do próprio alvo e `clients.manage`.
- Erro de recusa: `FORBIDDEN` no catálogo.
- `features/team/guard.ts` (`mayEditAppointments`, `mayEditBlock`, `mayEditSlotList`) lê a dona do registro no banco, dentro do `withTenant`, nunca do input. Id inexistente passa e o core responde `NOT_ALLOWED`.
- Onde há checagem: agenda (criar/remarcar/editar/status/vários status/`retrySync`), bloqueios, expediente e listas de vagas (`agenda.edit`); despesas (`finance.salon`); serviços (`services.manage`); Ajustes do salão, WhatsApp, calendários, Google, mensagens, avisos de teste, localização, IA, exportar dados (`salon.settings`); excluir conta (`salon.delete`). Profissional que cria atendimento/bloqueio/expediente/lista grava na agenda dela.
- Sem checagem de propósito: clientes, conversa do WhatsApp, sino, push do próprio aparelho, leituras (agenda, vagas, calendário). Telas por papel: ver A6 abaixo.
- Testes: `tests/unit/permissions.test.ts` (matriz) e `tests/db/professional-isolation.test.ts`.

## Calendários por profissional (task A4)
- Google, link do iPhone (.ics) e iCloud são de cada profissional. Quem gerencia é a profissional do login; owner/admin sem profissional ligada usam a padrão do salão (`features/team/professional.ts`: `calendarProfessionalId(me)`).
- Google: a conta Google do login ligado à profissional (`memberships.professional_id`). Profissional sem login, ou com login sem Google, não sincroniza e não dá erro. Dona sem vínculo (cadastro novo) vale pela profissional padrão.
- Desde a A6, criar/desligar link, ocultar nomes, iCloud e desconectar Google exigem `calendar.own` com alvo = a profissional do calendário: a profissional gerencia o próprio; owner/admin, o da padrão do salão.

## Avisos e push por profissional (task A5)
- Push de atendimento (resposta da cliente, "não respondeu") vai ao login ligado à profissional do atendimento + owner/admin; sem login dela, só owner/admin. Avisos do dia: profissional recebe o resumo da própria agenda, owner/admin o do salão. Detalhes em `avisos-push.md`; regra pura em `features/push/recipients.ts`.
- Textos de WhatsApp ganham `{profissional}` (vazio no salão com uma só); ver `lembretes.md`.
- Testes: `tests/unit/push-recipients.test.ts`, `tests/unit/reminder-text.test.ts`, `tests/db/avisos-profissional.test.ts`.

## Equipe, convite e telas por papel (task A6, migration 0038)
- Tela `/ajustes/equipe` (`team.manage`: dona e gerente): lista, adiciona, renomeia, desativa e reativa profissionais (`features/team/TeamList.tsx`, `actions.ts`, regras em `core.ts`). Desativar com atendimentos futuros exige destino: passar para outra profissional ou cancelar (o histórico fica); nunca desativa a última ativa (`LAST_PROFESSIONAL`). Atendimentos mexidos são ressincronizados no Google (`syncAppointmentSafe`).
- Convite: `team_invites` (RLS por salão, só o hash do token, vale 7 dias, uso único). Dona convida profissional ou gerente; gerente só convida profissional. Link `/convite/<token>` (público, `proxy.ts` libera `/convite/`): mostra salão e papel e leva ao Google. `startInvite` grava o token no cookie httpOnly `bubbly_invite` (1 h); o hook `user.create` de `lib/auth.ts` lê o cookie, dispensa a lista ALLOWED_EMAILS, chama `accept_team_invite` (atômica: marca usado e cria o vínculo com papel e profissional do convite) e não cria estúdio. Se o aceite falha (usado, expirado), apaga o usuário novo e devolve `INVITE_*` ao login. Quem já tem conta é mandado a `/agenda`.
- Migration 0038 também cria funções SECURITY DEFINER (search_path fixo, sem PUBLIC, só app_user) para leituras sem salão ativo: `feed_owner_by_token_hash` (feed anônimo), `first_professional_of` (Google), `team_invite_preview`, `accept_team_invite`. `professionals` tem FORCE RLS; hoje a conexão do app é dona do banco (ignora RLS), as funções são cinto e suspensório.
- Telas por papel (`features/team/access.ts`, `canOpenPath`): profissional não abre `/financeiro`, `/ajustes/whatsapp`, `/ajustes/mensagens`, `/ajustes/equipe` (a página redireciona via `requireTenantFor`; TabBar, SideNav e AppMenu escondem o item; Ajustes esconde as linhas). Serviços abre só para ver (`ServicesCatalog readOnly`; o servidor já barrava com `services.manage`). Expediente lê e grava a agenda da própria profissional (`ownAgendaId`).
- Testes: `tests/unit/invite.test.ts`, `tests/unit/team-access.test.ts`, `tests/db/team-invites.test.ts` (banco descartável `assist_mig0038_test`), `tests/e2e/equipe.spec.ts`.
