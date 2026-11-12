-- Resposta automática à cliente que chegou entre 21h e 6h: fica guardada aqui e sai às 6h
ALTER TABLE appointments ADD COLUMN pending_reply text;
