-- 0047 · "Assinado" do Calendário do iPhone passa a ser por profissional (o link mora em professionals desde a 0036).
-- Copia a marca do salão (0046) para a profissional que ficou com o mesmo link. tenants.calendar_fetched_at fica
-- sem uso (não removida: a main já a aplicou em produção).
alter table professionals add column if not exists calendar_fetched_at timestamptz;

update professionals p
set calendar_fetched_at = t.calendar_fetched_at
from tenants t
where t.id = p.tenant_id
  and t.calendar_token_hash is not null
  and p.calendar_token_hash = t.calendar_token_hash
  and p.calendar_fetched_at is null;
