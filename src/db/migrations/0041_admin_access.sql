-- 0041 · Painel do dono: 2FA, verificação por sessão e registro de acesso.
-- Nenhuma tabela daqui tem GRANT para app_user: só o dono do banco (servidor) lê e escreve.

-- Plugin twoFactor do Better Auth 1.7 (schema lido em node_modules/better-auth/dist/plugins/two-factor/schema.mjs).
ALTER TABLE "user" ADD COLUMN "twoFactorEnabled" boolean DEFAULT false;
CREATE TABLE "twoFactor" (
  id text PRIMARY KEY,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  verified boolean DEFAULT true,
  "failedVerificationCount" integer DEFAULT 0,
  "lockedUntil" timestamptz
);
CREATE INDEX two_factor_by_user ON "twoFactor" ("userId");
CREATE INDEX two_factor_by_secret ON "twoFactor" (secret);

-- Verificação do segundo fator ao entrar no /admin, válida por 12 h; some junto com a sessão (logout).
CREATE TABLE admin_step_up (
  session_id text PRIMARY KEY REFERENCES session(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now()
);

-- Quem abriu o quê no painel (guardado 12 meses; limpeza em features/retention).
CREATE TABLE admin_audit_log (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  action text NOT NULL,
  target text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_created ON admin_audit_log (created_at);
CREATE INDEX admin_audit_log_user_action ON admin_audit_log (user_id, action, created_at);
