-- Marco Civil (art. 15): registro de acesso guardado por 6 meses. Só o dono do banco lê/escreve
-- (app_user não tem GRANT); a limpeza diária do worker apaga o que passa de ~200 dias.
CREATE TABLE access_log (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX access_log_created ON access_log (created_at);
CREATE INDEX messages_created ON messages (created_at);
