-- LGPD: excluir cliente com histórico apaga os dados pessoais e mantém os atendimentos (financeiro)
ALTER TABLE clients ADD COLUMN anonymized_at timestamptz;
