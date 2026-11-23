-- 0052 · Promoções nos pacotes: período de venda, limite de clientes e um ou mais serviços.
--   starts_on / ends_on  vende só nesse período (null = sem data); a validade do pacote vendido não muda
--   max_clients          "as 30 primeiras": cada cliente compra 1 vez; esgota ao chegar no limite (null = sem limite)
--   service_ids          serviços em que a sessão vale (1 ou mais); service_id segue sendo o de referência do preço
--                        (no "Pague X, leve Y" é o mais caro da lista). Sem FK por elemento: o app só grava ids de
--                        serviços do salão (RLS) e o pacote vendido guarda a cópia.

ALTER TABLE package_templates
  ADD COLUMN starts_on date,
  ADD COLUMN ends_on date,
  ADD COLUMN max_clients smallint CHECK (max_clients IS NULL OR max_clients BETWEEN 1 AND 10000),
  ADD COLUMN service_ids uuid[];
UPDATE package_templates SET service_ids = ARRAY[service_id];
ALTER TABLE package_templates
  ALTER COLUMN service_ids SET NOT NULL,
  ADD CONSTRAINT package_templates_service_ids CHECK (
    cardinality(service_ids) BETWEEN 1 AND 30 AND service_id = ANY (service_ids)
  ),
  ADD CONSTRAINT package_templates_period CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on);

ALTER TABLE client_packages ADD COLUMN service_ids uuid[];
UPDATE client_packages SET service_ids = ARRAY[service_id];
ALTER TABLE client_packages
  ALTER COLUMN service_ids SET NOT NULL,
  ADD CONSTRAINT client_packages_service_ids CHECK (cardinality(service_ids) BETWEEN 1 AND 30);

-- Quantas clientes já compraram a promoção
CREATE INDEX client_packages_template ON client_packages (template_id, client_id) WHERE template_id IS NOT NULL;
