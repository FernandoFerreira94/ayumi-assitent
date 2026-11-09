-- Meu perfil: quem é a pessoa (nome, nascimento, profissão) e os segmentos do salão (vários, no lugar de um tipo só)
ALTER TABLE tenants
  ADD COLUMN owner_name text,
  ADD COLUMN birth_date date,
  ADD COLUMN profession text,
  ADD COLUMN segments text[] NOT NULL DEFAULT '{}';
-- Quem já tinha escolhido um tipo mantém o segmento equivalente
UPDATE tenants SET segments = ARRAY[
  CASE business_type
    WHEN 'unhas' THEN 'nail_designer'
    WHEN 'cabelo' THEN 'cabeleireiro'
    WHEN 'estetica' THEN 'esteticista'
    WHEN 'sobrancelhas_cilios' THEN 'designer_sobrancelhas'
    WHEN 'maquiagem' THEN 'maquiador'
    WHEN 'barbearia' THEN 'barbeiro'
    WHEN 'depilacao' THEN 'depilacao'
    WHEN 'massagem' THEN 'massoterapeuta'
    ELSE 'outro'
  END
] WHERE business_type IS NOT NULL AND segments = '{}';
