-- 0060 · Aviso de sinal recebido no WhatsApp (24/11, auditoria das mensagens, D3).
-- appointments.deposit_notice_at: aviso pendente e a partir de quando pode sair (espera o Desfazer). Só coluna nova.
ALTER TABLE appointments ADD COLUMN deposit_notice_at timestamptz;
CREATE INDEX appointments_deposit_notice_due ON appointments (deposit_notice_at)
  WHERE deposit_notice_at IS NOT NULL;
