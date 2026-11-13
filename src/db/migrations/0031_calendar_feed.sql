-- Link de calendário assinado (Calendário do iPhone): só o hash do token fica no banco; null = desligado
ALTER TABLE tenants ADD COLUMN calendar_token_hash text UNIQUE;
ALTER TABLE tenants ADD COLUMN calendar_hide_names boolean NOT NULL DEFAULT false;
GRANT UPDATE (calendar_token_hash, calendar_hide_names) ON tenants TO app_user;
