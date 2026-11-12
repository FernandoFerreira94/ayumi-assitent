-- Bom dia com mensagem motivacional às 7h (aviso do dia novo) e interruptor em Ajustes, ligado por padrão
ALTER TABLE owner_notices DROP CONSTRAINT owner_notices_kind_check;
ALTER TABLE owner_notices ADD CONSTRAINT owner_notices_kind_check
  CHECK (kind IN ('day_off', 'morning', 'day_end', 'week', 'holiday', 'good_morning'));
ALTER TABLE tenants ADD COLUMN good_morning boolean NOT NULL DEFAULT true;
