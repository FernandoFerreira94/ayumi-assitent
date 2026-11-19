-- 0048 · Ligar a Siri em 2 toques: código de pareamento de uso único.
-- O app cria a linha com o hash de um código curto (bubpar_…) e prazo de 15 min. O Atalho troca o código pela
-- chave de verdade (POST /api/v1/atalhos/parear): a mesma linha passa a guardar o hash da chave e o prazo vira NULL.
-- Linha com prazo preenchido ainda NÃO é chave: as rotas de leitura recusam.
ALTER TABLE api_tokens ADD COLUMN pairing_expires_at timestamptz;
