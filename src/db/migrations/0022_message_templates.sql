-- Mensagens do WhatsApp num cartão só em Ajustes: textos editáveis para o agendamento e o 2º aviso,
-- e a escolha de chamar a cliente pelo primeiro nome ou pelo nome inteiro do contato.
ALTER TABLE tenants
  ADD COLUMN booking_template text CHECK (booking_template IS NULL OR char_length(booking_template) <= 600),
  ADD COLUMN second_reminder_template text CHECK (second_reminder_template IS NULL OR char_length(second_reminder_template) <= 600),
  ADD COLUMN client_name_full boolean NOT NULL DEFAULT false;
GRANT UPDATE (reminder_template, booking_template, second_reminder_template, client_name_full) ON tenants TO app_user;

-- O interruptor "valor na confirmação" vira a chave {valor} no texto: quem tinha ligado continua recebendo o valor.
UPDATE tenants
SET booking_template = E'Oi, {nome}! Seu agendamento de {servico} está confirmado 💜\n📅 {dia}\n🕒 {hora}\n💰 {valor}\n\nTe esperamos com carinho!'
WHERE message_include_price AND booking_template IS NULL;

-- Respostas com IA ficam sempre ligadas (pedido da dona); o interruptor saiu de Ajustes.
ALTER TABLE tenants ALTER COLUMN ai_enabled SET DEFAULT true;
UPDATE tenants SET ai_enabled = true;
