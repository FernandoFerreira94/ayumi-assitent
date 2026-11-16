import type { OverviewRow, PaymentMethod, PlanKind } from "./types";

export type Tab = "todos" | "pagantes" | "teste" | "atraso" | "so_leitura" | "cancelados" | "cortesia";
export type SortKey = "salao" | "valor" | "vencimento" | "atraso";

export const TABS: { id: Tab; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pagantes", label: "Pagantes" },
  { id: "teste", label: "Teste" },
  { id: "atraso", label: "Em atraso" },
  { id: "so_leitura", label: "Só leitura" },
  { id: "cancelados", label: "Cancelados" },
  { id: "cortesia", label: "Cortesia" },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Mesma regra do summarize: pagante = active/past_due com valor; cortesia = Fundadora com valor 0. */
export function inTab(r: OverviewRow, tab: Tab): boolean {
  switch (tab) {
    case "todos":
      return true;
    case "pagantes":
      return (r.status === "active" || r.status === "past_due") && r.mrrCents > 0;
    case "teste":
      return r.status === "trialing";
    case "atraso":
      return r.status === "past_due";
    case "so_leitura":
      return r.status === "read_only";
    case "cancelados":
      return r.status === "canceled" || r.status === "expired";
    case "cortesia":
      return r.founder && r.amountCents === 0 && (r.status === "active" || r.status === "past_due");
  }
}

export function filterSubscribers(
  rows: OverviewRow[],
  f: { tab: Tab; kind?: PlanKind; method?: PaymentMethod; q?: string },
): OverviewRow[] {
  const q = f.q ? norm(f.q.trim()) : "";
  return rows.filter(
    (r) =>
      inTab(r, f.tab) &&
      (!f.kind || r.planKind === f.kind) &&
      (!f.method || r.paymentMethod === f.method) &&
      (!q || norm(r.salonName).includes(q) || norm(r.ownerName).includes(q)),
  );
}

const time = (d: Date | null) => (d ? d.getTime() : Number.POSITIVE_INFINITY);

export function sortSubscribers(rows: OverviewRow[], key: SortKey): OverviewRow[] {
  const copy = [...rows];
  switch (key) {
    case "salao":
      return copy.sort((a, b) => a.salonName.localeCompare(b.salonName, "pt-BR"));
    case "valor":
      return copy.sort((a, b) => b.mrrCents - a.mrrCents);
    case "vencimento":
      return copy.sort((a, b) => time(a.nextDueAt) - time(b.nextDueAt));
    case "atraso":
      return copy.sort((a, b) => (b.daysPastDue ?? 0) - (a.daysPastDue ?? 0));
  }
}
