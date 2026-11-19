# Carteira da cliente (sinal, crédito, devolução, pacotes)

**Finalidade:** controlar o dinheiro da cliente do salão (manual, sem gateway; não é a cobrança do Bubbly): sinal e saldo restante, crédito quando cancela, devolução e, nas próximas fases, pacotes e promoções. Plano completo e decisões D1-D6 (aprovadas em 19/11/2026): doc "Plano: sinal, estorno, créditos e pacotes".

## Fase atual: PR 1 (base)

- **Extrato imutável** `client_ledger` (migration 0049): cada linha é um movimento; saldos são sempre soma. O app só faz `SELECT`/`INSERT` (GRANT + gatilho `client_ledger_no_change`). Corrigir = linha do **mesmo tipo com valor negativo** e `reverses_id` apontando a original (uma anulação por linha, `UNIQUE`).
- **Tipos:** `payment`, `refund`, `credit_in`, `credit_use`, `retained`, `expire` e `session_*` (pacotes, ainda sem uso). Efeito de cada um no topo da migration e em `features/wallet/rules.ts`.
- **Política do salão** em `tenants`: `deposit_pct` (30), `cancel_notice_hours` (24), `late_cancel_keeps_deposit`, `no_show_keeps_deposit`, `no_show_uses_session` (todos true), `package_valid_days` (90), `pix_key`. Tela: Ajustes > Pagamentos (`WalletSettingsForm`, ação `saveWalletSettingsAction`).
- **Ligação com a agenda:** `insertAppointment` com "já pagou" e `setPayment` gravam/anulam pagamento do total no extrato (`wallet/core.recordPayment`, `reverseAppointmentPayments`). `paid_at`/`payment_method` continuam e são o que a tela lê; o extrato é a fonte para as próximas fases. A migration copiou os pagos de antes.
- **Clientes:** cliente com movimento na carteira é anonimizada, nunca apagada (`clients/core.deleteClientRow`).

## PR 2: sinal e saldo (19/11)

- **Agendar:** "A pagar" | "Sinal" | "Já pagou" (`PaymentFields`). Sinal vem preenchido com `suggestedDeposit(total, deposit_pct)` e mostra "Falta R$ X para pagar no dia". Campos do form: `paid` ("" | "deposit" | "1"), `depositAmount`, `paymentMethod`. Sinal inválido ou ≥ total = VALIDATION `depositAmount`.
- **Pago parcial:** `paid_at`/`payment_method` só quando pago o total (CHECK `appointments_payment_method_needs_paid`). O quanto foi pago vem do extrato: `paidCentsSql` (subquery em `listDay`/`pendencias`) e `livePaidCents`.
- **`setPayment`:** alvo maior que o pago = grava só a diferença; menor ou troca de forma = anula tudo e grava o alvo. Cancelado = NOT_ALLOWED.
- **Concluir = baixa automática:** `setStatus` para `done` grava o que faltava com motivo `AUTO_DONE_REASON` ("Recebido ao concluir"); sair de concluído anula só esses (`onlyAuto`). Migration 0050 fez a baixa dos concluídos antigos em `starts_at`.
- **Financeiro:** "A receber" = soma de (preço − pago) dos não concluídos; caixa **Entrou no caixa** = `cashInRange` (pagamentos − devoluções por `occurred_at`); lista "A pagar" mostra o que falta e "Adiantado e sinais" o que já entrou.
- Selo no card: "Sinal R$ X · falta R$ Y" (âmbar), ação "Receber o resto".

## Arquivos

- `features/wallet/rules.ts` (puro): `appointmentPaid`, `walletBalance`, `cashIn`, `remainingCents`, `suggestedDeposit`, `cancelOutcome` (D1/D2), `payXPrice`, `sessionValue`, `packageExpiresOn`, `parsePolicy`, `DEFAULT_POLICY`.
- `features/wallet/core.ts`: `paidCentsSql`, `cashInRange`, `livePaidCents`, `AUTO_DONE_REASON`, `clientMoves`, `appointmentMoves`, `recordPayment`, `reverseAppointmentPayments`, `getWalletSettings`, `saveWalletSettings`.
- Tela: `app/(app)/ajustes/pagamentos`. Linha em Ajustes > "Clientes e agenda".

## Próximas fases

3 cancelar/faltar com crédito, Devolver e carteira na ficha · 4 pacotes (Pague X leve Y, N sessões; `package_templates`, `client_packages`, `appointments.client_package_id`) · 5 automações (job `client-wallet-daily`) · 6 fidelidade/aniversário. Assinatura só após o Mercado Pago.

## Cuidados

- Nunca `UPDATE`/`DELETE` no extrato; nunca coluna de saldo.
- Mexer em saldo dentro do `lockTenant` (duas telas usando o mesmo crédito).
- Dinheiro em centavos. Ganhos (receita = atendido) e caixa (pagamentos − devoluções) são números diferentes de propósito (D3).
- Testes: `tests/unit/wallet.test.ts`, `tests/db/wallet.test.ts`, `tests/e2e/pagamentos-ajustes.spec.ts`, `tests/e2e/pagamento.spec.ts` (sinal).
