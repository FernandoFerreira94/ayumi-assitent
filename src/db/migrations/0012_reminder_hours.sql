-- Antecedência do lembrete configurável por estúdio (horas antes do horário marcado)
ALTER TABLE tenants ADD COLUMN reminder_hours integer NOT NULL DEFAULT 24 CHECK (reminder_hours BETWEEN 1 AND 72);
GRANT UPDATE (reminder_hours) ON tenants TO app_user;
CREATE POLICY tenant_self_update ON tenants FOR UPDATE TO app_user
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.tenant_id', true), '')::uuid);
