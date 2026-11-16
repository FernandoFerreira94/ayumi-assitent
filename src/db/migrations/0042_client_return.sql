-- Retorno da cliente: cada serviço pode ter um retorno aproximado (dias) e o atendimento concluído
-- guarda a data prevista do próximo. Só colunas novas e nulas; nada muda para os dados de hoje.
ALTER TABLE services ADD COLUMN return_days integer
  CHECK (return_days IS NULL OR return_days BETWEEN 1 AND 365);

-- Gravada quando o atendimento vira "done" (o menor retorno entre os serviços); limpa se desfizer.
ALTER TABLE appointments ADD COLUMN return_due_on date;
-- "Não precisa": some da lista Para chamar.
ALTER TABLE appointments ADD COLUMN return_skipped_at timestamptz;

CREATE INDEX appointments_return_due ON appointments (tenant_id, return_due_on)
  WHERE return_due_on IS NOT NULL AND return_skipped_at IS NULL;
