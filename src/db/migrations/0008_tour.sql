-- Quando a pessoa terminou (ou pulou) o tour do primeiro acesso. Nulo = ainda não viu.
ALTER TABLE memberships ADD COLUMN tour_done_at timestamptz;
