-- Sinal pedido à cliente (23/11): valor que a dona pediu ao agendar. Vai na mensagem de agendamento com a chave Pix
-- e NÃO entra no caixa: fica "Sinal pedido" até ela marcar "Sinal recebido" (pagamento no extrato).
-- Nulo = não pediu sinal.
ALTER TABLE appointments ADD COLUMN deposit_requested_cents integer;
ALTER TABLE appointments ADD CONSTRAINT appointments_deposit_requested_positive
  CHECK (deposit_requested_cents IS NULL OR deposit_requested_cents > 0);
