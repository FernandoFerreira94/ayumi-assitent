-- Meu perfil: apelido e WhatsApp são da pessoa (ficam no vínculo); endereço e Instagram são do estúdio.
ALTER TABLE memberships ADD COLUMN nickname text, ADD COLUMN phone_e164 text;
ALTER TABLE tenants ADD COLUMN address text, ADD COLUMN instagram text;
