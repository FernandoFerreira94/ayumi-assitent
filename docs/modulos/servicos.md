# Serviços (catálogo)

**Finalidade:** catálogo do estúdio: nome, valor, duração, categoria, cor do bloco no calendário, ordem arrastada, pausar/duplicar.

## Arquivos
- `features/services/actions.ts`: `saveService`, `duplicateService`, `setServiceActive`, `reorderServices`.
- `features/services/core.ts`: `listServices`, `listBookable`, `upcomingByService`, `insertService`, `updateService`...
- `features/services/catalog.ts`: regras puras e cores (`--svc-<cor>`, `-soft`, `-ink` em `globals.css`).
- UI: `ServicesCatalog.tsx`, `ServiceForm.tsx`. Tela: `app/(app)/servicos`.

## Dados
- `services` (valor em centavos, duração de 15 em 15 min, cor, ordem, ativo, excluído), `service_categories`.

## Ligações
- **Usado por:** appointments (preço/duração/rótulo; `listBookable`), hours (duração para vagas), finance (pizza por serviço), cards da agenda (cor do serviço).

## Cuidados
- Mesma ordem em toda tela (a ordem arrastada). Pausado some do agendar mas continua nos antigos.
- Mudar preço não altera agendamentos já feitos (valor guardado no agendamento).
- Limite de valor < R$ 100.000 (`lib/money.ts` casa com o schema).
- Testes: `tests/e2e/servicos.spec.ts`.
