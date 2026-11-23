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

## Tablet/desktop (18/11)
- `PageShell wide`; no `lg` duas colunas. Coluna nova (só `md+`): **Últimos 6 meses** (`MonthlyBars.tsx`, recebido x gastos, um eixo, hover com saldo, clique abre o mês, tabela sr-only), **Quem mais trouxe no mês** (top 5 concluídos) e **Faltas no mês** (% sobre concluído + faltou, valor perdido). Regras puras em `insights.ts` (`monthsUpTo`, `byMonth`, `topClients`, `noShows`; testes em `tests/unit/finance-insights.test.ts`). Ganhos mostra "mês anterior" no `md+`.
- Celular igual (as caixas novas ficam `hidden md:grid`).

## Pagamentos das clientes (19/11)
- Caixa "Pagamentos das clientes" (celular e desktop): A pagar (em aberto sem marcação) e Adiantado (pago antes do começo), com totais; tocar abre a `PaymentSheet` da agenda. Regra em `finance/payments.ts` (`splitPayments`), UI `PaymentList.tsx`.
- Não muda Ganhos/Previsto: recebido continua = concluído.
- 19/11 (carteira PR 2): "Entrou no caixa" (`wallet/core.cashInRange`, pela data do pagamento) e sinal: A pagar soma o que falta, "Adiantado e sinais" soma o que já entrou; **A receber** desconta o já pago (`paidCents`). Ver [carteira.md](carteira.md). "Como funciona" (regras do dinheiro da cliente) ao lado de "Pagamentos das clientes".

## Cuidados
- Previsto = tudo que não foi cancelado nem faltou (`no_show`); recebido = só `done`; o resumo mostra **A receber** = previsto − recebido (`summary.pending`, 19/11), para não repetir o valor de Ganhos (`appointments/core.forecastCents`/`receivedCents`). Remarcado transfere sem duplicar. Mudança em status ou desconto mexe aqui.
- Dinheiro sempre em centavos.
- Testes: `tests/e2e/financeiro.spec.ts`, `tests/db/expenses.test.ts`, `tests/unit/finance.test.ts`, `pricing.test.ts`.
