-- Respostas do WhatsApp: a cliente responde 1/2/3 ao lembrete e a conversa fica guardada.
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'reschedule_requested';
ALTER TABLE appointments ADD COLUMN reply_at timestamptz;
-- Nome e tipo do salão e o texto do lembrete, editáveis em Ajustes (null = texto padrão)
ALTER TABLE tenants ADD COLUMN business_type text, ADD COLUMN reminder_template text CHECK (length(reminder_template) <= 600);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('out', 'in')),
  kind text NOT NULL CHECK (kind IN ('manual', 'reminder', 'auto_reply', 'phone', 'client')),
  body text NOT NULL,
  intent text CHECK (intent IN ('confirm', 'cancel', 'reschedule')),
  external_id text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- webhook repetido e eco do próprio envio chegam com o mesmo id
  UNIQUE (tenant_id, external_id)
);
CREATE INDEX messages_client_created ON messages (client_id, created_at);
CREATE INDEX messages_unread ON messages (tenant_id) WHERE direction = 'in' AND read_at IS NULL;
CREATE INDEX messages_appointment ON messages (appointment_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO app_user;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messages TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
