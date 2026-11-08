-- Catálogo de serviços: categorias, ordem da lista, cor no calendário, intervalo depois,
-- preço "a partir de", pausa, "mostrar nas vagas" e observação interna.
CREATE TABLE service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  position integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX service_categories_tenant_name ON service_categories (tenant_id, lower(name));
GRANT SELECT, INSERT, UPDATE, DELETE ON service_categories TO app_user;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON service_categories TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE services
  -- RESTRICT: a tela só deixa excluir categoria vazia
  ADD COLUMN category_id uuid REFERENCES service_categories(id) ON DELETE RESTRICT,
  ADD COLUMN position integer NOT NULL DEFAULT 0,
  ADD COLUMN color text NOT NULL DEFAULT 'lav' CHECK (color IN ('lav', 'rosa', 'mel', 'verde', 'lilas', 'azul')),
  ADD COLUMN buffer_min integer NOT NULL DEFAULT 0 CHECK (buffer_min BETWEEN 0 AND 120),
  ADD COLUMN price_from boolean NOT NULL DEFAULT false,
  ADD COLUMN bookable boolean NOT NULL DEFAULT true,
  ADD COLUMN show_in_slots boolean NOT NULL DEFAULT true,
  ADD COLUMN notes text;
CREATE INDEX services_category ON services (category_id);

-- Quem já tem serviços ganha a categoria "Geral"; a ordem inicial é a alfabética, que era a mostrada até aqui.
INSERT INTO service_categories (tenant_id, name)
  SELECT DISTINCT tenant_id, 'Geral' FROM services;
UPDATE services s SET category_id = c.id FROM service_categories c WHERE c.tenant_id = s.tenant_id;
UPDATE services s SET position = r.n
  FROM (SELECT id, row_number() OVER (PARTITION BY tenant_id ORDER BY name) AS n FROM services) r
  WHERE r.id = s.id;

-- O intervalo depois do serviço também ocupa a agenda. Fica copiado no agendamento (mudar o serviço
-- vale só para os próximos) e o fim bloqueado é calculado aqui, para valer também ao remarcar.
ALTER TABLE appointments
  ADD COLUMN buffer_min integer NOT NULL DEFAULT 0 CHECK (buffer_min >= 0),
  ADD COLUMN blocked_until timestamptz;
UPDATE appointments SET blocked_until = ends_at;
ALTER TABLE appointments ALTER COLUMN blocked_until SET NOT NULL;

CREATE FUNCTION appointments_set_blocked_until() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.blocked_until := NEW.ends_at + make_interval(mins => NEW.buffer_min);
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_blocked_until BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION appointments_set_blocked_until();

ALTER TABLE appointments DROP CONSTRAINT appointments_no_overlap;
ALTER TABLE appointments ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
  tenant_id WITH =,
  tstzrange(starts_at, blocked_until) WITH &&
) WHERE (status <> 'cancelled');
