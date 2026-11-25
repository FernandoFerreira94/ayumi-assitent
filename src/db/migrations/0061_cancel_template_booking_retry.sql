-- 0061 · Mensagens do WhatsApp (24/11, auditoria): texto do aviso de cancelamento editável e nova tentativa da
-- mensagem de agendamento que falhou por instabilidade. Só colunas novas.
ALTER TABLE tenants ADD COLUMN cancel_template text;
GRANT UPDATE (cancel_template) ON tenants TO app_user;
ALTER TABLE appointments ADD COLUMN booking_retry_at timestamptz;
CREATE INDEX appointments_booking_retry_due ON appointments (booking_retry_at)
  WHERE booking_retry_at IS NOT NULL;
