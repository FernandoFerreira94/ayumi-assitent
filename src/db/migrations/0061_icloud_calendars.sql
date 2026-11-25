-- 0061 · Vários calendários do iCloud por estúdio (25/11/2026, aprovado pelo usuário).
-- Antes: um link só em tenants.icloud_calendar_url. Quem tem Pessoal, Trabalho etc. perdia os outros.
-- Agora: um link por calendário, com nome lido do ICS e o resultado da última leitura (para a tela de Ajustes).
-- O link nunca vai para a tela nem para log. A coluna antiga fica sem uso (remover num PR futuro).
CREATE TABLE icloud_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text,
  event_count integer NOT NULL DEFAULT 0,
  synced_at timestamptz,
  -- null = última leitura deu certo; senão o tipo do erro (not_found, failed, too_big, not_calendar)
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, url)
);

-- Evento importado sabe de qual calendário veio: cada calendário só apaga os seus.
ALTER TABLE blocks ADD COLUMN icloud_calendar_id uuid REFERENCES icloud_calendars(id) ON DELETE CASCADE;

-- Leva o link que já existia (antes de ligar o RLS: a migration roda como dono do banco)
INSERT INTO icloud_calendars (tenant_id, url)
  SELECT id, icloud_calendar_url FROM tenants WHERE icloud_calendar_url IS NOT NULL;
UPDATE blocks b SET icloud_calendar_id = c.id
  FROM icloud_calendars c
  WHERE b.source = 'icloud' AND b.tenant_id = c.tenant_id;

GRANT SELECT, INSERT, UPDATE, DELETE ON icloud_calendars TO app_user;
ALTER TABLE icloud_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE icloud_calendars FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON icloud_calendars TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- Resultado da última leitura do Google Agenda (linha de status em Ajustes > Calendários)
ALTER TABLE tenants ADD COLUMN google_synced_at timestamptz;
ALTER TABLE tenants ADD COLUMN google_event_count integer;
-- null = deu certo; 'reconnect' = Google pediu para entrar de novo; 'failed' = outra falha
ALTER TABLE tenants ADD COLUMN google_sync_error text;
GRANT UPDATE (google_synced_at, google_event_count, google_sync_error) ON tenants TO app_user;
