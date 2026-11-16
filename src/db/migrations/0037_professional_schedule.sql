-- Equipe: agenda por profissional. Bloco A do plano de pagamentos/Empresa (task A2).
-- professional_id em appointments, blocks (null = salão todo), working_hours e slot_lists;
-- a sobreposição de horários passa a valer por profissional, não por salão.

-- 1) Profissional padrão do salão: a primeira (position, created_at). Se o salão não tem nenhuma,
--    cria uma com o nome da dona (owner_name) ou o do salão. SECURITY DEFINER porque roda dentro de
--    withTenant como app_user; só aceita o salão ativo na sessão (quando há um), então não cria
--    profissional em outro salão. Serializa com o mesmo lock de lockTenant para não criar duas.
CREATE FUNCTION default_professional_id(p_tenant uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_active text := nullif(current_setting('app.tenant_id', true), '');
  v_id uuid;
BEGIN
  IF v_active IS NOT NULL AND v_active::uuid IS DISTINCT FROM p_tenant THEN
    RAISE EXCEPTION 'default_professional_id: salão diferente do ativo na sessão';
  END IF;
  SELECT id INTO v_id FROM professionals WHERE tenant_id = p_tenant ORDER BY position, created_at LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_tenant::text));
  SELECT id INTO v_id FROM professionals WHERE tenant_id = p_tenant ORDER BY position, created_at LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO professionals (tenant_id, display_name)
  SELECT t.id, coalesce(nullif(btrim(t.owner_name), ''), t.name) FROM tenants t WHERE t.id = p_tenant
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION default_professional_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION default_professional_id(uuid) TO app_user;

-- Trigger BEFORE INSERT: sem professional_id, entra a profissional padrão do salão.
CREATE FUNCTION set_default_professional() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.professional_id IS NULL THEN
    NEW.professional_id := default_professional_id(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION set_default_professional() FROM PUBLIC;

-- 2) Salões criados depois da 0036 ainda não têm profissional: cria uma para cada.
INSERT INTO professionals (tenant_id, display_name)
SELECT t.id, coalesce(nullif(btrim(t.owner_name), ''), t.name)
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM professionals p WHERE p.tenant_id = t.id);

-- Primeira profissional de cada salão, usada no backfill.
CREATE TEMP TABLE first_professional ON COMMIT DROP AS
SELECT DISTINCT ON (tenant_id) tenant_id, id AS professional_id
FROM professionals
ORDER BY tenant_id, position, created_at;

-- 3) appointments
ALTER TABLE appointments ADD COLUMN professional_id uuid REFERENCES professionals(id);
UPDATE appointments a SET professional_id = f.professional_id
FROM first_professional f WHERE f.tenant_id = a.tenant_id;
ALTER TABLE appointments ALTER COLUMN professional_id SET NOT NULL;
CREATE TRIGGER appointments_default_professional BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_default_professional();

-- Mesma faixa de antes (início até blocked_until, sem cancelados), agora por profissional.
ALTER TABLE appointments DROP CONSTRAINT appointments_no_overlap;
ALTER TABLE appointments ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
  professional_id WITH =,
  tstzrange(starts_at, blocked_until) WITH &&
) WHERE (status <> 'cancelled');
CREATE INDEX appointments_professional_start ON appointments (professional_id, starts_at);

-- 4) blocks: null = vale para o salão todo (ex.: feriado); sem trigger.
ALTER TABLE blocks ADD COLUMN professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE;
CREATE INDEX blocks_professional_start ON blocks (professional_id, starts_at);

-- 5) working_hours: chave passa a ser (profissional, dia)
ALTER TABLE working_hours ADD COLUMN professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE;
UPDATE working_hours w SET professional_id = f.professional_id
FROM first_professional f WHERE f.tenant_id = w.tenant_id;
ALTER TABLE working_hours ALTER COLUMN professional_id SET NOT NULL;
ALTER TABLE working_hours DROP CONSTRAINT working_hours_pkey;
ALTER TABLE working_hours ADD PRIMARY KEY (professional_id, weekday);
CREATE TRIGGER working_hours_default_professional BEFORE INSERT ON working_hours
  FOR EACH ROW EXECUTE FUNCTION set_default_professional();

-- 6) slot_lists: nome único por profissional
ALTER TABLE slot_lists ADD COLUMN professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE;
UPDATE slot_lists s SET professional_id = f.professional_id
FROM first_professional f WHERE f.tenant_id = s.tenant_id;
ALTER TABLE slot_lists ALTER COLUMN professional_id SET NOT NULL;
ALTER TABLE slot_lists DROP CONSTRAINT slot_lists_tenant_id_name_key;
ALTER TABLE slot_lists ADD CONSTRAINT slot_lists_professional_name_key UNIQUE (professional_id, name);
CREATE TRIGGER slot_lists_default_professional BEFORE INSERT ON slot_lists
  FOR EACH ROW EXECUTE FUNCTION set_default_professional();
