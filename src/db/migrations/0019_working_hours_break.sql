-- Pausa fixa do dia (ex.: almoço 12:00–13:00). Vagas não oferece esse horário e a agenda mostra a faixa.
ALTER TABLE working_hours
  ADD COLUMN break_start text CHECK (break_start IS NULL OR break_start ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  ADD COLUMN break_end text CHECK (break_end IS NULL OR break_end ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  ADD CONSTRAINT working_hours_break_check CHECK (
    (break_start IS NULL AND break_end IS NULL)
    OR (break_start IS NOT NULL AND break_end IS NOT NULL AND break_start >= opens AND break_end <= closes AND break_end > break_start)
  );
