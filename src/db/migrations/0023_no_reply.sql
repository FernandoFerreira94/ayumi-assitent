-- Aviso à dona de que a cliente não respondeu aos lembretes: marca para avisar uma vez só por agendamento.
ALTER TABLE appointments ADD COLUMN no_reply_at timestamptz;
