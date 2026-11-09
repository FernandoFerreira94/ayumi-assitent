-- Cancelamento com confirmação ("cancelar ou remarcar?") e reforço único de confirmação
ALTER TABLE appointments ADD COLUMN cancel_asked_at timestamptz, ADD COLUMN nudge_sent_at timestamptz;
