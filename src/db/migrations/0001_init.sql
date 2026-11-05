CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_e164 text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, phone_e164)
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  active boolean NOT NULL DEFAULT true
);

CREATE TYPE appointment_status AS ENUM ('pending_confirmation','confirmed','cancelled','done','no_show');

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  service_id uuid NOT NULL REFERENCES services(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  status appointment_status NOT NULL DEFAULT 'pending_confirmation',
  google_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  -- impede dois agendamentos ativos sobrepostos no mesmo estúdio
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    tenant_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled')
);
CREATE INDEX appointments_tenant_start ON appointments (tenant_id, starts_at);

CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  CHECK (ends_at > starts_at)
);

-- Papel da aplicação: sem superuser, sujeito a RLS.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients, services, appointments, blocks TO app_user;
GRANT SELECT ON tenants TO app_user;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_self ON tenants FOR SELECT TO app_user
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['clients','services','appointments','blocks'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY tenant_isolation ON %I TO app_user
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)$p$, t);
  END LOOP;
END $$;
