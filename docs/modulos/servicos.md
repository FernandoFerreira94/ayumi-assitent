# Serviços (catálogo)

**Finalidade:** catálogo do estúdio: nome, valor, duração, categoria, cor do bloco no calendário, ordem arrastada, pausar/duplicar.

## Arquivos
- `features/services/actions.ts`: `saveService`, `duplicateService`, `setServiceActive`, `reorderServices`.
- `features/services/core.ts`: `listServices`, `listBookable`, `upcomingByService`, `insertService`, `updateService`...
- `features/services/catalog.ts`: regras puras e cores (`--svc-<cor>`, `-soft`, `-ink` em `globals.css`).
- UI: `ServicesCatalog.tsx`, `ServiceForm.tsx`. Tela: `app/(app)/servicos`.

## Dados
- `services` (valor em centavos, duração de 15 em 15 min, cor, ordem, ativo, excluído, `return_days` = retorno aproximado em dias, null = sem retorno), `service_categories`.

## Ligações
- **Usado por:** appointments (preço/duração/rótulo; `listBookable`), hours (duração para vagas), finance (pizza por serviço), cards da agenda (cor do serviço).

## Cuidados
- Mesma ordem em toda tela (a ordem arrastada). Pausado some do agendar mas continua nos antigos.
- Mudar preço não altera agendamentos já feitos (valor guardado no agendamento).
- Limite de valor < R$ 100.000 (`lib/money.ts` casa com o schema).
- Retorno sugerido (16/11, migration `0042_client_return`): chips Sem retorno/7/15/21/30/45/60 dias/Outro (1–365) no `ServiceForm`; a lista mostra "volta em ~N dias". Regra pura em `features/returns/rules.ts` (`returnDue` = menor retorno entre os serviços do atendimento). Plano completo (pergunta ao concluir, histórico, Para chamar): `docs/superpowers/plans/2026-11-16-retorno-cliente.md`.
- Testes: `tests/e2e/servicos.spec.ts`, `tests/unit/returns.test.ts`.
