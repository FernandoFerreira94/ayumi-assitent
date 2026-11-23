-- Quando a pessoa terminou (ou pulou) a entrada de primeiro acesso: horários, avisos, agenda e localização.
-- Nulo = ainda não fez. Quem já passou pelo tour antigo não refaz a entrada.
ALTER TABLE memberships ADD COLUMN onboarding_done_at timestamptz;
UPDATE memberships SET onboarding_done_at = tour_done_at WHERE tour_done_at IS NOT NULL;
