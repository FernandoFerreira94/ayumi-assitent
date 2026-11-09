-- Observação do agendamento (ex.: motivo do desconto), para a profissional lembrar depois.
ALTER TABLE appointments
  ADD COLUMN notes text CHECK (notes IS NULL OR char_length(notes) <= 300);
