-- Gastos do estúdio (lançamento manual) para o Financeiro: o ganho vem dos atendimentos concluídos.
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  spent_on date NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0 AND amount_cents < 10000000),
  category text NOT NULL CHECK (category IN ('produtos', 'aluguel', 'contas', 'equipe', 'marketing', 'outros')),
  note text CHECK (note IS NULL OR length(note) <= 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX expenses_tenant_spent ON expenses (tenant_id, spent_on);
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO app_user;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON expenses TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
