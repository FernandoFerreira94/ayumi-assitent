import { splitTotal } from "@/features/appointments/pricing";

/** Partes do atendimento por id do serviço (json do banco; null nos antigos, de um serviço só). */
type Part = { name: string; cents: number };
export type SaleRow = { priceCents: number; serviceId: string; parts: Part[] | string | null };
export type ServiceSales = { count: number; cents: number };

/**
 * Vendas por serviço: um atendimento com dois serviços conta 1 em cada e
 * divide o valor cobrado na proporção do preço cheio de cada um (igual à pizza do Financeiro).
 */
export function salesByService(rows: SaleRow[]): Map<string, ServiceSales> {
  const out = new Map<string, ServiceSales>();
  for (const r of rows) {
    const parsed = typeof r.parts === "string" ? (JSON.parse(r.parts) as Part[]) : r.parts;
    const parts = parsed?.length ? splitTotal(r.priceCents, parsed) : [{ name: r.serviceId, cents: r.priceCents }];
    for (const p of parts) {
      const cur = out.get(p.name) ?? { count: 0, cents: 0 };
      out.set(p.name, { count: cur.count + 1, cents: cur.cents + p.cents });
    }
  }
  return out;
}
