-- 0057 · Respostas que o sistema não entendeu (23/11/2026, aprovado pelo usuário).
-- Só entra mensagem que chegou como possível resposta a uma pergunta do sistema (até 12 h depois, curta) e não foi
-- entendida. Conversa da dona com a cliente fora disso nunca entra. Sem telefone: a cliente fica só pelo id interno.
-- Retenção: 90 dias (features/retention). Sai junto com a cliente (cascade ou exclusão com histórico) e com o salão.
-- Leitura e rótulo só no painel do dono (/admin/respostas, como dono do banco). O salão só grava e apaga as suas.
CREATE TABLE unclear_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  -- reminder = lembrete/aviso com 1/2/3; ambiguous = mais de um horário esperando resposta
  question text NOT NULL CHECK (question IN ('reminder', 'ambiguous')),
  body text NOT NULL CHECK (length(body) <= 500),
  ai_intent text,
  ai_confidence real,
  -- o que o sistema fez: alerted = avisou a dona; silent = não avisou (já tinha avisado); guess = palpite de cancelar/remarcar
  decision text NOT NULL CHECK (decision IN ('alerted', 'silent', 'guess', 'ambiguous')),
  label text CHECK (label IN ('confirm', 'cancel', 'reschedule', 'late', 'question', 'other')),
  labeled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX unclear_replies_created ON unclear_replies (created_at);
CREATE INDEX unclear_replies_client ON unclear_replies (client_id);

GRANT SELECT, INSERT, DELETE ON unclear_replies TO app_user;
ALTER TABLE unclear_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE unclear_replies FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON unclear_replies TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
