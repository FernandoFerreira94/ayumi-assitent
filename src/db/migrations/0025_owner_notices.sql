-- Avisos do dia no celular da profissional (folga, resumo da manhã, fim do expediente, roteiro da semana e
-- datas comemorativas). Uma linha por tipo e dia: o worker roda a cada 5 min e só manda uma vez.
ALTER TABLE tenants ADD COLUMN city text;
ALTER TABLE tenants ADD COLUMN state text;
ALTER TABLE tenants ADD COLUMN latitude double precision;
ALTER TABLE tenants ADD COLUMN longitude double precision;

CREATE TABLE owner_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('day_off', 'morning', 'day_end', 'week', 'holiday')),
  day date NOT NULL,
  -- Qual texto do banco de frases saiu (para não repetir os últimos)
  variant smallint NOT NULL DEFAULT 0,
  title text NOT NULL,
  body text NOT NULL,
  -- Texto longo aberto ao tocar (roteiro da semana, mensagem pronta para as clientes)
  detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, kind, day)
);
CREATE INDEX owner_notices_tenant_kind ON owner_notices (tenant_id, kind, day DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON owner_notices TO app_user;
ALTER TABLE owner_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_notices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON owner_notices TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
