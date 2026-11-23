-- 0057 · Sessão do pacote nas mensagens de WhatsApp.
-- tenants.package_line: põe "✨ Sessão 3 de 6 do seu pacote" na confirmação e nos avisos (ligado por padrão).
-- Só coluna nova; nada muda para os dados de hoje.
ALTER TABLE tenants ADD COLUMN package_line boolean NOT NULL DEFAULT true;
GRANT UPDATE (package_line) ON tenants TO app_user;
