-- 0047 · Chaves pessoais da API (Siri e Atalhos do iPhone). Fase 1: só leitura da agenda.
-- Separada do link do Calendário: desligar uma não derruba a outra, e um vazamento do link não abre a API.
-- Só o hash (SHA-256) fica no banco; a chave aparece uma vez na tela.
CREATE TABLE api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Quem criou; some se a conta for apagada
  user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  token_hash text NOT NULL UNIQUE,
  scope text NOT NULL DEFAULT 'read' CHECK (scope IN ('read')),
  last4 text NOT NULL CHECK (length(last4) = 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX api_tokens_tenant ON api_tokens (tenant_id, created_at) WHERE revoked_at IS NULL;

GRANT SELECT, INSERT ON api_tokens TO app_user;
GRANT UPDATE (revoked_at, last_used_at) ON api_tokens TO app_user;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON api_tokens TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
