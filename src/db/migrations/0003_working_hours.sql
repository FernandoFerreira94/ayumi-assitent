CREATE TABLE working_hours (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = domingo
  opens text NOT NULL CHECK (opens ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  closes text NOT NULL CHECK (closes ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  PRIMARY KEY (tenant_id, weekday),
  CHECK (closes > opens)
);
-- sem linha para o dia = estúdio fechado nesse dia
GRANT SELECT, INSERT, UPDATE, DELETE ON working_hours TO app_user;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON working_hours TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
