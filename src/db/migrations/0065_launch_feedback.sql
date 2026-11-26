-- 0065 · Feedback do lançamento grátis (26/11/2026).
-- Cartão no Painel depois de 7 dias de estúdio (conta a partir de tenants.created_at): o que mais ajuda, o que falta
-- e uma nota de 0 a 10. Uma linha por pessoa do estúdio; "Agora não" também grava (skipped) para o cartão não voltar.
-- Leitura só no painel do dono (/admin/feedback, como dono do banco). O salão só grava e lê a sua.
CREATE TABLE launch_feedback (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  helps text CHECK (length(helps) <= 500),
  missing text CHECK (length(missing) <= 500),
  score smallint CHECK (score BETWEEN 0 AND 10),
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id),
  -- Quem respondeu deu pelo menos a nota
  CHECK (skipped OR score IS NOT NULL)
);
CREATE INDEX launch_feedback_created ON launch_feedback (created_at DESC);

GRANT SELECT, INSERT ON launch_feedback TO app_user;
ALTER TABLE launch_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_feedback FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON launch_feedback TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
