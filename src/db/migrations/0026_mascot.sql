-- Mascote e cores do app escolhidos por cada pessoa em Meu perfil (ids em src/components/brand/mascots.ts)
ALTER TABLE memberships ADD COLUMN mascot text NOT NULL DEFAULT 'bolha';
