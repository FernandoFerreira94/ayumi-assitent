-- Meu perfil: tipo de serviço do estúdio e textos personalizados enviados às clientes.
ALTER TABLE tenants ADD COLUMN category text, ADD COLUMN msg_confirmation text, ADD COLUMN msg_reminder text;
