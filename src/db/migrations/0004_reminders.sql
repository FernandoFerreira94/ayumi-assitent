ALTER TABLE appointments ADD COLUMN reminder_sent_at timestamptz;
-- pendentes de lembrete: consulta do worker
CREATE INDEX appointments_reminder_due ON appointments (starts_at) WHERE reminder_sent_at IS NULL;
