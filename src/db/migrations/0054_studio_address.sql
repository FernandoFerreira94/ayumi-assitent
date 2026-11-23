-- Endereço do estúdio (Ajustes > Endereço), em campos, para a dona cadastrar com busca de CEP.
-- `address` (já existia, sem tela) continua sendo a linha pronta: vai no convite da cliente (.ics), no evento do
-- Google e nas chaves {endereco}/{mapa} das mensagens.
ALTER TABLE tenants
  ADD COLUMN address_cep text CHECK (address_cep IS NULL OR address_cep ~ '^[0-9]{8}$'),
  ADD COLUMN address_street text CHECK (address_street IS NULL OR length(address_street) <= 120),
  ADD COLUMN address_number text CHECK (address_number IS NULL OR length(address_number) <= 10),
  ADD COLUMN address_complement text CHECK (address_complement IS NULL OR length(address_complement) <= 60),
  ADD COLUMN address_district text CHECK (address_district IS NULL OR length(address_district) <= 80),
  ADD COLUMN address_city text CHECK (address_city IS NULL OR length(address_city) <= 80),
  ADD COLUMN address_state text CHECK (address_state IS NULL OR address_state ~ '^[A-Z]{2}$');
GRANT UPDATE (address, address_cep, address_street, address_number, address_complement, address_district,
  address_city, address_state) ON tenants TO app_user;

-- Nada se perde: a cidade/UF que já existe (localização dos avisos do dia) vira o ponto de partida do endereço.
-- As colunas city/state/latitude/longitude seguem como estão (previsão do tempo e feriados).
UPDATE tenants
SET address_city = left(btrim(city), 80),
    address_state = upper(btrim(state))
WHERE address_city IS NULL
  AND city IS NOT NULL AND btrim(city) <> ''
  AND upper(btrim(coalesce(state, ''))) ~ '^[A-Z]{2}$';

-- Mensagens: o nome da cliente sai do texto padrão. Quem salvou o padrão antigo sem mexer volta ao padrão (null),
-- e passa a receber o novo (o navegador manda a quebra de linha como \r\n); texto editado pela dona fica como ela escreveu.
UPDATE tenants SET booking_template = NULL
WHERE replace(booking_template, E'\r\n', E'\n') = E'Oi, {nome}! Seu agendamento de {servico} está confirmado 💜\n📅 {dia}\n🕒 {hora}\n\nTe esperamos com carinho!';
UPDATE tenants SET reminder_template = NULL
WHERE replace(reminder_template, E'\r\n', E'\n') = 'Oi, {nome}! Passando para lembrar do seu horário de {servico} {dia} às {hora}. Te espero com carinho! 💜';
UPDATE tenants SET second_reminder_template = NULL
WHERE replace(second_reminder_template, E'\r\n', E'\n') = 'Oi, {nome}! Passando para lembrar do seu horário de {servico} {dia} às {hora} 😊 Pode me confirmar?';
