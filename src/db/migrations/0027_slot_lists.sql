-- Listas de vagas salvas (Vagas > Personalizada): nome + filtros (serviço, período, dias da semana, turnos) para reutilizar.
CREATE TABLE slot_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON slot_lists TO app_user;
ALTER TABLE slot_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_lists FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON slot_lists TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
