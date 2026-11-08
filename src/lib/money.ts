// Limite do schema de serviço (< R$ 100.000): a máscara nunca mostra um valor que o servidor recusaria.
const MAX_CENTS = 9_999_999;
const fmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Máscara de reais que enche pela direita, como no app do banco: "15000" vira "150,00". */
export function maskMoney(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";
  return fmt.format(Math.min(Number(digits), MAX_CENTS) / 100);
}
