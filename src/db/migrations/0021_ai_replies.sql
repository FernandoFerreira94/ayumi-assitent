-- Respostas automáticas por IA: liga/desliga e regras da profissional (texto livre), e marca de que o agendamento
-- já foi passado para a profissional (uma passagem por agendamento).
ALTER TABLE tenants
  ADD COLUMN ai_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN ai_rules text CHECK (ai_rules IS NULL OR char_length(ai_rules) <= 1000);
GRANT UPDATE (ai_enabled, ai_rules) ON tenants TO app_user;

ALTER TABLE appointments ADD COLUMN ai_handoff_at timestamptz;
