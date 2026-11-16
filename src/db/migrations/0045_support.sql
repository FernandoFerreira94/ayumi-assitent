-- 0045 · Suporte e avisos do dono.
-- 0043-0044 ficam livres para o retorno da cliente; 0036-0040 são do plano Empresa (pagamentos).

-- Conversa de suporte: uma por salão (as mensagens em ordem). O salão escreve como app_user (RLS);
-- a resposta do dono é gravada pelo servidor (dono do banco), nunca pelo app_user.
CREATE TABLE support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('salon', 'admin')),
  -- Quem escreveu (pessoa do salão ou o dono); some se a conta for apagada
  user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
  -- Lida pelo outro lado (salão lê a do dono; dono lê a do salão)
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_messages_tenant ON support_messages (tenant_id, created_at);
CREATE INDEX support_messages_unread ON support_messages (author, tenant_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT ON support_messages TO app_user;
GRANT UPDATE (read_at) ON support_messages TO app_user;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY support_read ON support_messages FOR SELECT TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
-- O salão só escreve como salão
CREATE POLICY support_write ON support_messages FOR INSERT TO app_user
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND author = 'salon');
-- O salão só marca como lida a resposta do dono
CREATE POLICY support_mark_read ON support_messages FOR UPDATE TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND author = 'admin')
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND author = 'admin');

-- Avisos do dono para todos os salões (cartão no Painel). Só o servidor escreve; o app só lê.
CREATE TABLE platform_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 400),
  tone text NOT NULL DEFAULT 'info' CHECK (tone IN ('info', 'important')),
  -- Sem data = fica até o dono encerrar
  ends_at timestamptz,
  ended_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_notices_live ON platform_notices (created_at DESC) WHERE ended_at IS NULL;
GRANT SELECT ON platform_notices TO app_user;

-- Quem já fechou o aviso (por pessoa: cada uma vê e fecha o seu)
CREATE TABLE platform_notice_dismissals (
  notice_id uuid NOT NULL REFERENCES platform_notices(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);
GRANT SELECT, INSERT ON platform_notice_dismissals TO app_user;
ALTER TABLE platform_notice_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_notice_dismissals FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform_notice_dismissals TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
