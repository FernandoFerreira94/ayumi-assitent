-- 0050 · Carteira: atendimentos já concluídos ganham a baixa do que faltava ("Recebido ao concluir"), no dia do
-- atendimento. A partir daqui o app grava essa baixa sozinho ao concluir (appointments/core.setStatus), e o
-- "Entrou no caixa" do Financeiro vira só a soma do extrato. Não mexe em nada além de inserir.
INSERT INTO client_ledger (tenant_id, client_id, appointment_id, kind, amount_cents, method, reason, occurred_at)
SELECT a.tenant_id, a.client_id, a.id, 'payment', a.price_cents - coalesce(p.paid, 0), a.payment_method,
       'Recebido ao concluir', a.starts_at
FROM appointments a
LEFT JOIN (
  SELECT appointment_id, sum(amount_cents) AS paid
  FROM client_ledger WHERE kind = 'payment' GROUP BY appointment_id
) p ON p.appointment_id = a.id
WHERE a.status = 'done' AND a.price_cents - coalesce(p.paid, 0) > 0;
