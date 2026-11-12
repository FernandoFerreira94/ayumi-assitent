-- 1º aviso do WhatsApp com interruptor em Ajustes, ligado por padrão (quem já usa continua recebendo)
ALTER TABLE tenants ADD COLUMN first_reminder boolean NOT NULL DEFAULT true;
