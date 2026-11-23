-- 0059 · Aviso de cancelamento no WhatsApp (D3: "Avisar a cliente?" ao cancelar, ligado por padrão).
-- appointments.cancel_notice_at: aviso pendente e a partir de quando pode sair (espera o Desfazer). Só coluna nova.
ALTER TABLE appointments ADD COLUMN cancel_notice_at timestamptz;
CREATE INDEX appointments_cancel_notice_due ON appointments (cancel_notice_at)
  WHERE cancel_notice_at IS NOT NULL;
