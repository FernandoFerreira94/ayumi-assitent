-- Controle total dos avisos por WhatsApp: segundo aviso opcional (null = só um aviso) e valor opcional na mensagem de agendamento
ALTER TABLE tenants
  ADD COLUMN second_reminder_hours integer DEFAULT 3 CHECK (second_reminder_hours BETWEEN 1 AND 72),
  ADD COLUMN message_include_price boolean NOT NULL DEFAULT false;
GRANT UPDATE (second_reminder_hours, message_include_price) ON tenants TO app_user;
