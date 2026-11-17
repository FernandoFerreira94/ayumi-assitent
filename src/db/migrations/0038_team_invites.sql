-- Equipe: convites de profissional/gerente (A6) e funções mínimas para leituras sem salão ativo.
-- Transacional (o migrate roda cada arquivo dentro de uma transação).

-- 1) Convites: link de 7 dias, só o hash do token fica no banco.
CREATE TABLE team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'professional')),
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by text REFERENCES "user"(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (role <> 'professional' OR professional_id IS NOT NULL)
);
CREATE INDEX team_invites_tenant ON team_invites (tenant_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON team_invites TO app_user;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON team_invites TO app_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- 2) Funções SECURITY DEFINER para o que roda fora do withTenant (feed anônimo do calendário, profissional
--    padrão do Google, convite no cadastro). Só as colunas necessárias, search_path fixo, sem PUBLIC.

-- Dona do link do calendário (rota anônima /api/calendar/<token>).
CREATE FUNCTION feed_owner_by_token_hash(p_hash text)
RETURNS TABLE (id uuid, tenant_id uuid, tenant_name text, hide_names boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT p.id, p.tenant_id, t.name, p.calendar_hide_names
  FROM professionals p JOIN tenants t ON t.id = p.tenant_id
  WHERE p.calendar_token_hash = p_hash
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION feed_owner_by_token_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION feed_owner_by_token_hash(text) TO app_user;

-- Primeira profissional do salão (só leitura; não cria, ao contrário de default_professional_id).
CREATE FUNCTION first_professional_of(p_tenant uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT id FROM professionals WHERE tenant_id = p_tenant ORDER BY position, created_at LIMIT 1
$$;
REVOKE ALL ON FUNCTION first_professional_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION first_professional_of(uuid) TO app_user;

-- O que a página pública /convite/<token> mostra. state: valid | expired | used. Sem linha = convite inexistente.
CREATE FUNCTION team_invite_preview(p_hash text)
RETURNS TABLE (tenant_name text, role text, professional_name text, state text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT t.name, i.role, p.display_name,
         CASE WHEN i.used_at IS NOT NULL THEN 'used'
              WHEN i.expires_at <= now() THEN 'expired'
              ELSE 'valid' END
  FROM team_invites i
  JOIN tenants t ON t.id = i.tenant_id
  LEFT JOIN professionals p ON p.id = i.professional_id
  WHERE i.token_hash = p_hash
$$;
REVOKE ALL ON FUNCTION team_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION team_invite_preview(text) TO app_user;

-- Aceita o convite de forma atômica: marca como usado e cria o vínculo (role e profissional do convite).
-- Falha com INVITE_INVALID | INVITE_EXPIRED | INVITE_USED; qualquer erro desfaz tudo (inclusive o "usado").
CREATE FUNCTION accept_team_invite(p_hash text, p_user text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v team_invites%ROWTYPE;
BEGIN
  UPDATE team_invites SET used_at = now()
  WHERE token_hash = p_hash AND used_at IS NULL AND expires_at > now()
  RETURNING * INTO v;
  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM team_invites WHERE token_hash = p_hash AND used_at IS NOT NULL) THEN
      RAISE EXCEPTION 'INVITE_USED';
    ELSIF EXISTS (SELECT 1 FROM team_invites WHERE token_hash = p_hash) THEN
      RAISE EXCEPTION 'INVITE_EXPIRED';
    END IF;
    RAISE EXCEPTION 'INVITE_INVALID';
  END IF;
  -- A profissional já tem outro login: o convite não vale mais
  IF v.professional_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM memberships WHERE professional_id = v.professional_id) THEN
    RAISE EXCEPTION 'INVITE_INVALID';
  END IF;
  INSERT INTO memberships (user_id, tenant_id, role, professional_id)
  VALUES (p_user, v.tenant_id, v.role, v.professional_id);
  RETURN v.tenant_id;
END $$;
REVOKE ALL ON FUNCTION accept_team_invite(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_team_invite(text, text) TO app_user;
