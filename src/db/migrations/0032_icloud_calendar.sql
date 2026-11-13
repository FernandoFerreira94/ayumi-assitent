-- Calendário do iPhone (iCloud) para dentro do app: link público do calendário (só leitura) e eventos importados
ALTER TABLE tenants ADD COLUMN icloud_calendar_url text;
GRANT UPDATE (icloud_calendar_url) ON tenants TO app_user;
-- blocks.source ganha 'icloud'; external_uid = UID do evento (+ início, nas repetições)
ALTER TABLE blocks ADD COLUMN external_uid text;
CREATE UNIQUE INDEX blocks_tenant_external_uid ON blocks (tenant_id, external_uid) WHERE external_uid IS NOT NULL;
-- Evento de fora que virou atendimento no app: fica escondido e não ocupa mais o horário
ALTER TABLE blocks ADD COLUMN converted_at timestamptz;
ALTER TABLE blocks DROP CONSTRAINT blocks_source_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_source_check CHECK (source IN ('app', 'google', 'icloud'));
