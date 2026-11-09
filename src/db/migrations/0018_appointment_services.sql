-- Vários serviços num atendimento (ex.: escova + hidratação) e desconto em % ou R$.
-- appointments.service_id continua sendo o primeiro serviço, para o que já lê só ele seguir funcionando;
-- a lista completa (com valor e duração do momento do agendamento) fica em appointment_services.
CREATE TABLE appointment_services (
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id),
  position smallint NOT NULL CHECK (position >= 0 AND position < 10),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  duration_min integer NOT NULL CHECK (duration_min > 0),
  PRIMARY KEY (appointment_id, position)
);
CREATE INDEX appointment_services_service ON appointment_services (tenant_id, service_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON appointment_services TO app_user;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON appointment_services TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- Os atendimentos que já existem ganham a linha do serviço único deles
INSERT INTO appointment_services (appointment_id, tenant_id, service_id, position, price_cents, duration_min)
SELECT id, tenant_id, service_id, 0, price_cents, greatest(1, round(extract(epoch FROM ends_at - starts_at) / 60)::int)
FROM appointments;

-- price_cents passa a ser o total já com desconto; discount_cents guarda quanto saiu
ALTER TABLE appointments
  ADD COLUMN discount_kind text CHECK (discount_kind IN ('pct', 'brl')),
  ADD COLUMN discount_value integer CHECK (discount_value IS NULL OR discount_value > 0),
  ADD COLUMN discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0);
