/** Desconto do agendamento: em porcentagem (1 a 100) ou em reais (guardado em centavos). */
export type DiscountKind = "pct" | "brl";
export type Discount = { kind: DiscountKind; value: number };

/** Quanto sai e quanto fica. O desconto nunca passa do subtotal. */
export function applyDiscount(subtotalCents: number, discount: Discount | null) {
  const off = !discount
    ? 0
    : discount.kind === "pct"
      ? Math.round((subtotalCents * discount.value) / 100)
      : discount.value;
  const discountCents = Math.min(Math.max(off, 0), subtotalCents);
  return { discountCents, totalCents: subtotalCents - discountCents };
}

/**
 * Lê o desconto digitado: "10" ou "10%" em %; "15", "15,50" ou "R$ 1.015,50" em reais.
 * Vazio = sem desconto (null); fora da faixa = "invalid".
 */
export function parseDiscount(kind: unknown, raw: unknown): Discount | null | "invalid" {
  if (kind !== "pct" && kind !== "brl") return null;
  const text = String(raw ?? "")
    .replace(/R\$|%|\s/g, "")
    .trim();
  if (!text) return null;
  if (kind === "pct") {
    if (!/^\d{1,3}$/.test(text)) return "invalid";
    const v = Number(text);
    return v >= 1 && v <= 100 ? { kind, value: v } : "invalid";
  }
  // Formato brasileiro: ponto de milhar opcional, vírgula decimal com até 2 casas
  if (!/^\d{1,3}(\.?\d{3})*(,\d{1,2})?$/.test(text)) return "invalid";
  const [int, dec = ""] = text.replace(/\./g, "").split(",");
  const cents = Number(int) * 100 + Number(dec.padEnd(2, "0"));
  return cents > 0 && cents < 10_000_000 ? { kind, value: cents } : "invalid";
}

/**
 * Divide o total (já com desconto) entre os serviços na proporção do valor de cada um,
 * para a pizza do Financeiro. A soma das partes é sempre igual ao total.
 */
export function splitTotal(totalCents: number, parts: { name: string; cents: number }[]) {
  const base = parts.reduce((s, p) => s + p.cents, 0);
  if (parts.length === 0) return [];
  if (base <= 0) return parts.map((p, i) => ({ name: p.name, cents: i === 0 ? totalCents : 0 }));
  const raw = parts.map((p) => (totalCents * p.cents) / base);
  const out = raw.map((r, i) => ({ name: parts[i]!.name, cents: Math.floor(r) }));
  let rest = totalCents - out.reduce((s, p) => s + p.cents, 0);
  // Os centavos que sobram vão para quem tem a maior fração
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    out[i]!.cents++;
    rest--;
  }
  return out;
}
