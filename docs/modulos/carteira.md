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

## PR 3: cancelar, faltar, crédito e devolver (19/11)

- **Status ↔ carteira** (`wallet/core.settleStatusChange`, chamado no `appointments/core.setStatus`): ir para `cancelled`/`no_show` aplica `cancelOutcome` com a política do salão: `credit_in` (vira crédito) e `retained` (sinal fica), os dois com `appointment_id`. Sair de cancelado/faltou anula esses dois (o pago volta ao atendimento). Cancelado/faltou não aceita `setPayment` (NOT_ALLOWED) e o card esconde o selo de pagamento.
- `setStatus` devolve `{ wallet: Outcome | null }`; o toast do card diz "R$ X virou crédito da cliente; sinal de R$ Y ficou para o salão". Recebe `createdBy`.
- **Crédito automático:** `insertAppointment` usa o crédito da cliente (`useCredit`, dentro do `lockTenant`) no que o sinal/"já pagou" não cobriu; cobrindo tudo, marca `paid_at`. Devolve `credit` e a folha de agendar avisa "Usou R$ X do crédito da cliente". `setPayment` desconta a parte paga com crédito.
- Pago do atendimento agora = `appointmentPaidCents` (pagamentos + crédito usado − o que saiu); concluir dá baixa só do que falta disso.
- **Ficha da cliente** (`ClientWallet`, dentro de `ClientCardContent`): "Crédito no salão", extrato (`rules.walletStatement`, só o que mexe no crédito) e **Devolver** (`refundCreditAction` → `refundCredit`, `refund` sem atendimento, no máximo o crédito, com `lockTenant`). Some quando nunca houve crédito.
- WhatsApp: a cliente "cancelar" vira `reschedule_requested` (não cancela), então não mexe na carteira.

## PR 4: pacotes (19/11)

- **Migration 0051:** `package_templates` (modelo: `pay_x` "Pague X, leve Y" ou `sessions`; um serviço; `sessions_paid`/`sessions_total`/`price_cents`/`valid_days`/`active`), `client_packages` (pacote vendido: cópia de nome, serviço, sessões e preço; `sold_on`, `expires_on`), `client_ledger.client_package_id` e `appointments.client_package_id`. FKs compostas com `tenant_id`; RLS `tenant_isolation`; `client_packages` só SELECT/INSERT.
- **Sessões no extrato:** venda = `session_grant` (+N) + `payment` com `client_package_id` (entra no caixa, **não** no crédito: `walletEffect` ignora movimento de pacote). Agendar = `session_reserve` (1 sessão, `amount_cents` = preço ÷ sessões, conta como pago). Cancelar (ou faltar com "sessão volta") = `session_return`. Restam = grant − reserve + return (`rules.packageSessionsLeft`).
- **Agendar** (`insertAppointment`): `packages.pickSession` acha o pacote valendo no dia para um dos serviços (vence primeiro); o serviço entra no total pelo valor da sessão (Ganhos por sessão, D3) e o resto segue sinal/crédito/"já pagou". Devolve `session` e a folha avisa "Usou 1 sessão do pacote X. Restam N de M".
- **Cancelar/faltar** (`settleStatusChange`): a parte do pacote nunca vira dinheiro; a sessão volta ou fica pela política. Toast: "a sessão voltou para o pacote".
- **Telas:** Ajustes > Pagamentos > "Pacotes à venda" (`PackageTemplates`, criar com prévia `rules.packagePreview`, Tirar = `active=false`); ficha da cliente > "Pacotes" (`ClientPackages` + `SellPackageSheet`, pago na hora).
- Fora da v1: venda com parte a receber, pacote com vários serviços, editar atendimento com pacote (não recalcula), vencimento automático (PR 5, job `client-wallet-daily`).

## Arquivos

- `features/wallet/rules.ts` (puro): `appointmentPaid`, `walletBalance`, `cashIn`, `remainingCents`, `suggestedDeposit`, `cancelOutcome` (D1/D2), `walletEffect`, `walletStatement`, `payXPrice`, `sessionValue`, `packageExpiresOn`, `parsePolicy`, `DEFAULT_POLICY`.
- `features/wallet/core.ts`: `settleStatusChange`, `useCredit`, `refundCredit`, `clientBalance`, `appointmentPaidCents`, `paidCentsSql`, `cashInRange`, `livePaidCents`, `AUTO_DONE_REASON`, `clientMoves`, `appointmentMoves`, `recordPayment`, `reverseAppointmentPayments`, `getWalletSettings`, `saveWalletSettings`.
- `features/wallet/packages.ts`: `listTemplates`, `createTemplate`, `archiveTemplate`, `sellPackage`, `clientPackageList`, `pickSession`, `reserveSession`. UI: `PackageSheets.tsx`, `ClientWallet.tsx`.
- Tela: `app/(app)/ajustes/pagamentos`. Linha em Ajustes > "Clientes e agenda".

## Próximas fases

5 automações (job `client-wallet-daily`) · 6 fidelidade/aniversário. Assinatura só após o Mercado Pago.

## Cuidados

- Nunca `UPDATE`/`DELETE` no extrato; nunca coluna de saldo.
- Mexer em saldo dentro do `lockTenant` (duas telas usando o mesmo crédito).
- Dinheiro em centavos. Ganhos (receita = atendido) e caixa (pagamentos − devoluções) são números diferentes de propósito (D3).
- Testes: `tests/unit/wallet.test.ts`, `tests/db/wallet.test.ts`, `tests/e2e/pagamentos-ajustes.spec.ts`, `tests/e2e/pagamento.spec.ts` (sinal).
