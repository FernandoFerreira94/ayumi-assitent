-- 0056 · Aviso de remarcação no WhatsApp.
-- tenants.reschedule_notice: avisar a cliente ao remarcar (ligado por padrão); reschedule_template: texto (null = padrão).
-- appointments.reschedule_notice_at: aviso pendente e a partir de quando pode sair (o arraste espera o Desfazer);
-- appointments.notified_starts_at: o horário que a cliente conhece (o da última mensagem). Igual ao atual = não avisa.
-- Só colunas novas; nada muda para os dados de hoje.
ALTER TABLE tenants ADD COLUMN reschedule_notice boolean NOT NULL DEFAULT true;
ALTER TABLE tenants ADD COLUMN reschedule_template text;
GRANT UPDATE (reschedule_notice, reschedule_template) ON tenants TO app_user;

ALTER TABLE appointments ADD COLUMN reschedule_notice_at timestamptz;
ALTER TABLE appointments ADD COLUMN notified_starts_at timestamptz;
-- O worker procura avisos vencidos em todos os estúdios: índice só das linhas pendentes
CREATE INDEX appointments_reschedule_notice_due ON appointments (reschedule_notice_at)
  WHERE reschedule_notice_at IS NOT NULL;
