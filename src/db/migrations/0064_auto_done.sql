-- 0064 · Conclusão automática da agenda (25/11).
-- appointments.auto_done_at: quando o sistema concluiu sozinho o atendimento que já terminou.
-- A dona trocar o status zera. Só coluna nova, nula para todos os atendimentos existentes.
ALTER TABLE appointments ADD COLUMN auto_done_at timestamptz;
