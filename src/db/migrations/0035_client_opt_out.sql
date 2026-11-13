-- Cliente respondeu SAIR: não recebe mais mensagens automáticas (confirmação, 1º e 2º aviso). VOLTAR desfaz.
ALTER TABLE clients ADD COLUMN opted_out_at timestamptz;
