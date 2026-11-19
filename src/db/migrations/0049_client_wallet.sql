-- 0049 · Carteira da cliente (base). Extrato de dinheiro e sessões que só aceita inserção.
-- Pagamento manual da cliente do salão (sem gateway); não é a cobrança do Bubbly.
-- Cada linha é um movimento. Saldos são sempre a soma; não existe coluna de saldo para não divergir.
-- Correção nunca edita nem apaga: grava outra linha do MESMO tipo com valor negativo e reverses_id = a original.
--
-- Efeito de cada tipo (amount_cents sempre >= 0, menos nas anulações):
--   payment       cliente pagou. Com atendimento: conta como pago nele. Sem: entra na carteira.
--   refund        salão devolveu dinheiro. Com atendimento: sai do pago dele. Sem: sai da carteira.
--   credit_in     valor pago de um atendimento (cancelado, sobra) virou crédito na carteira.
--   credit_use    crédito da carteira usado para pagar um atendimento.
--   retained      sinal que ficou para o salão (cancelou em cima da hora ou faltou).
--   expire        crédito ou sessões que venceram.
--   session_*     sessões de pacote (fase dos pacotes): grant, reserve, use, return.

-- Chaves compostas: o movimento nunca aponta para cliente ou atendimento de outro estúdio.
ALTER TABLE clients ADD CONSTRAINT clients_tenant_id_id UNIQUE (tenant_id, id);
ALTER TABLE appointments ADD CONSTRAINT appointments_tenant_id_id UNIQUE (tenant_id, id);

CREATE TABLE client_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  appointment_id uuid,
  kind text NOT NULL CHECK (kind IN (
    'payment', 'refund', 'credit_in', 'credit_use', 'retained', 'expire',
    'session_grant', 'session_reserve', 'session_use', 'session_return'
  )),
  amount_cents integer NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  method text CHECK (method IS NULL OR method IN ('pix', 'dinheiro', 'cartao')),
  reason text CHECK (reason IS NULL OR length(reason) <= 300),
  reverses_id uuid UNIQUE REFERENCES client_ledger(id),
  -- Quem lançou; null = o próprio app (migração, automação)
  created_by text REFERENCES "user"(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, client_id) REFERENCES clients (tenant_id, id),
  FOREIGN KEY (tenant_id, appointment_id) REFERENCES appointments (tenant_id, id),
  CHECK (amount_cents <> 0 OR sessions <> 0),
  -- Só anulação é negativa
  CHECK (reverses_id IS NOT NULL OR (amount_cents >= 0 AND sessions >= 0))
);
CREATE INDEX client_ledger_client ON client_ledger (tenant_id, client_id, occurred_at);
CREATE INDEX client_ledger_appointment ON client_ledger (appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX client_ledger_day ON client_ledger (tenant_id, occurred_at);

-- Imutável para o app: sem UPDATE/DELETE no GRANT e um gatilho de reforço. O dono do banco ainda apaga em cascata
-- (excluir conta/estúdio), por isso o gatilho só barra o app_user.
CREATE FUNCTION client_ledger_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'app_user' THEN
    RAISE EXCEPTION 'client_ledger é só inserção: grave uma anulação' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN COALESCE(OLD, NEW);
END $$;
CREATE TRIGGER client_ledger_no_change BEFORE UPDATE OR DELETE ON client_ledger
  FOR EACH ROW EXECUTE FUNCTION client_ledger_immutable();

GRANT SELECT, INSERT ON client_ledger TO app_user;
ALTER TABLE client_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_ledger FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON client_ledger TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- Política do salão (decisões D1, D2, D4 e D5 de 19/11/2026). Tudo tem padrão; a dona muda em Ajustes > Pagamentos.
ALTER TABLE tenants
  -- Sinal sugerido quando a dona escolhe "Sinal" ao agendar (% do total). Sinal é opcional.
  ADD COLUMN deposit_pct smallint NOT NULL DEFAULT 30 CHECK (deposit_pct BETWEEN 5 AND 100),
  -- Cancelou com pelo menos isso de antecedência: o pago vira crédito. Menos: o sinal fica para o salão.
  ADD COLUMN cancel_notice_hours smallint NOT NULL DEFAULT 24 CHECK (cancel_notice_hours BETWEEN 0 AND 168),
  ADD COLUMN late_cancel_keeps_deposit boolean NOT NULL DEFAULT true,
  -- Faltou: o sinal fica para o salão e a sessão do pacote é consumida
  ADD COLUMN no_show_keeps_deposit boolean NOT NULL DEFAULT true,
  ADD COLUMN no_show_uses_session boolean NOT NULL DEFAULT true,
  -- Validade padrão de pacote vendido (dias). Crédito em dinheiro não vence.
  ADD COLUMN package_valid_days smallint NOT NULL DEFAULT 90 CHECK (package_valid_days BETWEEN 7 AND 730),
  -- Chave Pix para a mensagem pedir o sinal; null = não pede
  ADD COLUMN pix_key text CHECK (pix_key IS NULL OR length(btrim(pix_key)) BETWEEN 1 AND 140);
GRANT UPDATE (deposit_pct, cancel_notice_hours, late_cancel_keeps_deposit, no_show_keeps_deposit,
  no_show_uses_session, package_valid_days, pix_key) ON tenants TO app_user;

-- Dados de hoje: cada atendimento marcado como pago vira um pagamento do valor total, na data em que foi marcado.
INSERT INTO client_ledger (tenant_id, client_id, appointment_id, kind, amount_cents, method, occurred_at, created_at)
SELECT tenant_id, client_id, id, 'payment', price_cents, payment_method, paid_at, paid_at
FROM appointments
WHERE paid_at IS NOT NULL AND price_cents > 0;
