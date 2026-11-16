-- Equipe: quem atende (profissionais) e papéis do vínculo. Bloco A do plano de pagamentos/Empresa.
-- Esta migration não mexe em appointments/blocks/working_hours/slot_lists (isso é da 0037).

-- 1) Uma pessoa, um salão (D6). Quem já tem dois vínculos fica com um só, de forma determinística:
--    o de dono primeiro, depois o do salão mais antigo. O salão em si não é apagado.
DELETE FROM memberships m
USING (
  SELECT m2.user_id, m2.tenant_id,
         row_number() OVER (
           PARTITION BY m2.user_id
           ORDER BY (m2.role = 'owner') DESC, t.created_at, m2.tenant_id
         ) AS rn
  FROM memberships m2
  JOIN tenants t ON t.id = m2.tenant_id
) r
WHERE m.user_id = r.user_id AND m.tenant_id = r.tenant_id AND r.rn > 1;

CREATE UNIQUE INDEX memberships_user_unique ON memberships (user_id);

-- 2) Papéis: staff vira professional; admin é novo.
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
UPDATE memberships SET role = 'professional' WHERE role = 'staff';
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('owner', 'admin', 'professional'));

-- 3) Profissionais do salão (podem não ter login). Campos de calendário copiados de tenants
--    (que os mantém até a limpeza, como na 0029).
CREATE TABLE professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  color text,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  calendar_token_hash text UNIQUE,
  calendar_hide_names boolean NOT NULL DEFAULT false,
  icloud_calendar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX professionals_tenant_active_position ON professionals (tenant_id, active, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON professionals TO app_user;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON professionals TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE memberships ADD COLUMN professional_id uuid REFERENCES professionals(id);

-- 4) Backfill: 1 profissional por salão, com o nome da dona (owner_name, senão o nome do usuário,
--    senão o nome do salão); o vínculo de dono aponta para ela.
WITH owners AS (
  SELECT DISTINCT ON (m.tenant_id) m.tenant_id, m.user_id, u.name AS user_name
  FROM memberships m
  JOIN "user" u ON u.id = m.user_id
  WHERE m.role = 'owner'
  ORDER BY m.tenant_id, u."createdAt", m.user_id
),
novas AS (
  INSERT INTO professionals (tenant_id, display_name, calendar_token_hash, calendar_hide_names, icloud_calendar_url)
  SELECT t.id,
         coalesce(nullif(btrim(t.owner_name), ''), nullif(btrim(o.user_name), ''), t.name),
         t.calendar_token_hash, t.calendar_hide_names, t.icloud_calendar_url
  FROM tenants t
  LEFT JOIN owners o ON o.tenant_id = t.id
  RETURNING id, tenant_id
)
UPDATE memberships m SET professional_id = n.id
FROM novas n
JOIN owners o ON o.tenant_id = n.tenant_id
WHERE m.tenant_id = n.tenant_id AND m.user_id = o.user_id;
