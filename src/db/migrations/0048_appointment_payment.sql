-- 0048 · Pagamento da cliente no agendamento (manual, sem gateway).
-- paid_at = quando a dona marcou como pago (antes do começo = "pago adiantado"); null = ainda não marcado.
-- payment_method é opcional e só existe com paid_at. Só colunas novas e nulas; nada muda para os dados de hoje.
ALTER TABLE appointments ADD COLUMN paid_at timestamptz;
ALTER TABLE appointments ADD COLUMN payment_method text
  CHECK (payment_method IS NULL OR payment_method IN ('pix', 'dinheiro', 'cartao'));
ALTER TABLE appointments ADD CONSTRAINT appointments_payment_method_needs_paid
  CHECK (payment_method IS NULL OR paid_at IS NOT NULL);
