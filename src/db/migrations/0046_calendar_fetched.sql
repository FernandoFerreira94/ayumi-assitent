-- 0046 · Calendário do iPhone: quando o iPhone leu o link pela última vez.
-- Mostra "Assinado" no sheet assim que o iPhone assina. Link novo zera (null = ainda não assinou).
alter table tenants add column if not exists calendar_fetched_at timestamptz;
GRANT UPDATE (calendar_fetched_at) ON tenants TO app_user;
