-- 0051 · Pacotes e promoções (carteira, PR 4). Dois modelos na v1: "Pague X, leve Y" e "Pacote de sessões".
-- O modelo (package_templates) é o que o salão oferece; o pacote vendido (client_packages) guarda uma cópia do
-- nome, serviço, sessões e preço: mudar o modelo ou o catálogo não mexe no que já foi vendido.
-- Sessões vivem no extrato (client_ledger), como o dinheiro:
--   session_grant   venda: +N sessões no pacote (sessions = N)
--   session_reserve agendar com o pacote: 1 sessão (sessions = 1) e amount_cents = valor da sessão (preço ÷ N),
--                   que conta como pago no atendimento e é o que entra nos Ganhos ao concluir
--   session_return  cancelou (ou faltou com a política "sessão volta"): a sessão volta para o pacote
-- Disponível = grant − reserve + return (anulações já entram com sinal trocado).

ALTER TABLE services ADD CONSTRAINT services_tenant_id_id UNIQUE (tenant_id, id);

CREATE TABLE package_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- pay_x = "Pague X, leve Y" (preço = X × valor do serviço); sessions = N sessões por um preço
  kind text NOT NULL CHECK (kind IN ('pay_x', 'sessions')),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
  service_id uuid NOT NULL,
  sessions_paid smallint CHECK (sessions_paid IS NULL OR sessions_paid BETWEEN 1 AND 100),
  sessions_total smallint NOT NULL CHECK (sessions_total BETWEEN 1 AND 100),
  price_cents integer NOT NULL CHECK (price_cents BETWEEN 0 AND 10000000),
  -- null = usa a validade padrão de Ajustes > Pagamentos
  valid_days smallint CHECK (valid_days IS NULL OR valid_days BETWEEN 7 AND 730),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, service_id) REFERENCES services (tenant_id, id),
  CHECK (kind <> 'pay_x' OR (sessions_paid IS NOT NULL AND sessions_paid < sessions_total))
);
CREATE INDEX package_templates_tenant ON package_templates (tenant_id) WHERE active;

CREATE TABLE client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  template_id uuid,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
  service_id uuid NOT NULL,
  sessions_total smallint NOT NULL CHECK (sessions_total BETWEEN 1 AND 100),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  sold_on date NOT NULL,
  expires_on date,
  created_by text REFERENCES "user"(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, client_id) REFERENCES clients (tenant_id, id),
  FOREIGN KEY (tenant_id, template_id) REFERENCES package_templates (tenant_id, id),
  FOREIGN KEY (tenant_id, service_id) REFERENCES services (tenant_id, id)
);
CREATE INDEX client_packages_client ON client_packages (tenant_id, client_id);

ALTER TABLE client_ledger ADD COLUMN client_package_id uuid;
ALTER TABLE client_ledger ADD CONSTRAINT client_ledger_package_fk
  FOREIGN KEY (tenant_id, client_package_id) REFERENCES client_packages (tenant_id, id);
CREATE INDEX client_ledger_package ON client_ledger (client_package_id) WHERE client_package_id IS NOT NULL;

-- Pacote usado no atendimento (null = sem pacote)
ALTER TABLE appointments ADD COLUMN client_package_id uuid;
ALTER TABLE appointments ADD CONSTRAINT appointments_package_fk
  FOREIGN KEY (tenant_id, client_package_id) REFERENCES client_packages (tenant_id, id);

GRANT SELECT, INSERT, UPDATE (name, sessions_paid, sessions_total, price_cents, valid_days, active)
  ON package_templates TO app_user;
GRANT SELECT, INSERT ON client_packages TO app_user;

ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON package_templates TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON client_packages TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
