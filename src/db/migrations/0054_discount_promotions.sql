-- 0054 · Promoção de desconto no agendamento ("as 30 primeiras clientes que agendarem ganham 20%") e pausar.
--   promotions         desconto em % ou R$ sobre os serviços escolhidos, com período e limite de clientes opcionais.
--                      paused = fora do ar por enquanto (volta quando a dona retomar); ended_at = encerrada à mão.
--   appointments.promotion_id  atendimento que usou a promoção. Usos = clientes distintas com atendimento não
--                      cancelado (cancelar libera a vaga). 1 por cliente. A conta e o limite são feitos dentro
--                      do lockTenant do agendamento, então duas telas não passam do limite.
--   package_templates.paused   pausar a venda de um pacote sem tirar da lista.

CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text CHECK (name IS NULL OR length(btrim(name)) BETWEEN 1 AND 60),
  discount_kind text NOT NULL CHECK (discount_kind IN ('pct', 'brl')),
  discount_value integer NOT NULL CHECK (discount_value > 0 AND discount_value < 10000000),
  service_ids uuid[] NOT NULL CHECK (cardinality(service_ids) BETWEEN 1 AND 30),
  starts_on date,
  ends_on date,
  max_clients smallint CHECK (max_clients IS NULL OR max_clients BETWEEN 1 AND 10000),
  paused boolean NOT NULL DEFAULT false,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  CHECK (discount_kind <> 'pct' OR discount_value <= 99),
  CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX promotions_tenant ON promotions (tenant_id) WHERE ended_at IS NULL;

ALTER TABLE appointments ADD COLUMN promotion_id uuid;
ALTER TABLE appointments ADD CONSTRAINT appointments_promotion_fk
  FOREIGN KEY (tenant_id, promotion_id) REFERENCES promotions (tenant_id, id);
CREATE INDEX appointments_promotion ON appointments (promotion_id, client_id) WHERE promotion_id IS NOT NULL;

ALTER TABLE package_templates ADD COLUMN paused boolean NOT NULL DEFAULT false;
GRANT UPDATE (paused) ON package_templates TO app_user;

GRANT SELECT, INSERT, UPDATE (paused, ended_at) ON promotions TO app_user;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON promotions TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
