-- 0062 · Planos: desativar nunca exclui; editar e excluir separados (25/11/2026).
--   Desativar = paused (já existia). Reativar limpa paused e o antigo ended_at ("Encerrar" saiu da tela).
--   Editar: nome, período e limite do pacote; tudo da promoção (quem já usou guarda o desconto em R$ no
--   próprio agendamento, e quem comprou pacote guarda a cópia em client_packages).
--   Excluir (digitar "excluir"): nunca usado = DELETE de verdade; já vendido/usado = some da lista e para de valer
--   (package_templates.active = false; promotions.deleted_at), mas a linha fica para o histórico das clientes.
ALTER TABLE promotions ADD COLUMN deleted_at timestamptz;

GRANT UPDATE (name, discount_kind, discount_value, service_ids, starts_on, ends_on, max_clients, deleted_at)
  ON promotions TO app_user;
GRANT UPDATE (starts_on, ends_on, max_clients) ON package_templates TO app_user;
GRANT DELETE ON promotions, package_templates TO app_user;
