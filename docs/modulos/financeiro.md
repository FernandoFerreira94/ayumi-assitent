# Financeiro

**Finalidade:** previsto e recebido por período (mês), despesas lançadas pela dona e pizza de serviços/gastos. Na aba aparece como "Finanças".

## Arquivos
- `features/finance/summary.ts` (totais a partir dos agendamentos; usa valor cheio de cada serviço em `appointment_services`), `period.ts`, `expenses.ts`, `actions.createExpense`/`deleteExpense`.
- UI: `ServicePie.tsx` (paleta própria validada, tema claro), `ExpenseList.tsx`, `NewExpenseSheet.tsx`. Tela: `app/(app)/financeiro`.
- Também usa `appointments/core.forecastCents`/`receivedCents`.

## Dados
- `expenses` (centavos, categoria, data), lê `appointments`/`appointment_services`.

## Ligações
- **Usa:** appointments (status e valores com desconto), services.
- Sem uso por outros módulos.

## Cuidados
- Previsto = tudo que não foi cancelado nem faltou (`no_show`); recebido = só `done` (`appointments/core.forecastCents`/`receivedCents`). Remarcado transfere sem duplicar. Mudança em status ou desconto mexe aqui.
- Dinheiro sempre em centavos.
- Testes: `tests/e2e/financeiro.spec.ts`, `tests/db/expenses.test.ts`, `tests/unit/finance.test.ts`, `pricing.test.ts`.
