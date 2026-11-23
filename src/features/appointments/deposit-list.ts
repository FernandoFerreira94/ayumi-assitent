import { addDays, todayStr } from "@/lib/dates";
import type { PaymentView } from "./payment";

/**
 * Lista de agendamentos com o sinal (tela /agendamentos). Regras puras, sem banco: em que grupo cada atendimento
 * cai, o resumo do topo e os filtros. O estado do pagamento vem de `paymentView` (mesma regra do selo do card).
 */

/** sinal pago (falta o resto) · sinal pedido (aguardando a cliente) · sem sinal (nada pago) · pago (tudo) */
export type DepositGroup = "deposit" | "requested" | "none" | "paid";
export const DEPOSIT_GROUPS: readonly DepositGroup[] = ["deposit", "requested", "none", "paid"];
export const GROUP_LABEL: Record<DepositGroup, string> = {
  deposit: "Sinal pago",
  requested: "Sinal pedido",
  none: "Sem sinal",
  paid: "Pago",
};

export type Period = "hoje" | "semana" | "proximos";
export const PERIODS: readonly Period[] = ["hoje", "semana", "proximos"];
export const PERIOD_LABEL: Record<Period, string> = { hoje: "Hoje", semana: "7 dias", proximos: "Próximos" };
/** "Próximos" = hoje até este tanto de dias à frente (a consulta traz só isso). */
export const AHEAD_DAYS = 60;

export const isPeriod = (v: unknown): v is Period => typeof v === "string" && (PERIODS as readonly string[]).includes(v);
export const isGroup = (v: unknown): v is DepositGroup =>
  typeof v === "string" && (DEPOSIT_GROUPS as readonly string[]).includes(v);

export function depositGroup(p: Pick<PaymentView, "state">): DepositGroup {
  switch (p.state) {
    case "deposit":
      return "deposit";
    case "deposit_requested":
      return "requested";
    case "unpaid":
      return "none";
    default:
      return "paid";
  }
}

export type DepositItem = {
  id: string;
  startsAt: Date;
  clientName: string;
  serviceName: string;
  payment: PaymentView;
};

/** Último dia (AAAA-MM-DD, inclusive) do período, contado a partir de hoje no fuso do estúdio. */
export function periodEnd(period: Period, today: string): string {
  return addDays(today, period === "hoje" ? 0 : period === "semana" ? 6 : AHEAD_DAYS);
}

/** Sem acento e minúsculo, para a busca achar "Júlia" digitando "julia". */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Só o período e a busca (o resumo do topo conta antes do filtro de grupo). */
export function inPeriod<T extends DepositItem>(items: T[], period: Period, q: string, now: Date): T[] {
  const end = periodEnd(period, todayStr(now));
  const needle = fold(q);
  return items.filter(
    (x) => todayStr(x.startsAt) <= end && (!needle || fold(x.clientName).includes(needle)),
  );
}

export type GroupSummary = { count: number; cents: number };

/**
 * Resumo por grupo: sinal pago = quanto já entrou de sinal; pedido = quanto falta a cliente mandar do sinal;
 * sem sinal = quanto há a receber; pago = total pago.
 */
export function summarize(items: DepositItem[]): Record<DepositGroup, GroupSummary> {
  const out = Object.fromEntries(DEPOSIT_GROUPS.map((g) => [g, { count: 0, cents: 0 }])) as Record<
    DepositGroup,
    GroupSummary
  >;
  for (const x of items) {
    const g = depositGroup(x.payment);
    const p = x.payment;
    out[g].count += 1;
    out[g].cents +=
      g === "deposit"
        ? p.paidCents
        : g === "requested"
          ? Math.max(0, p.requestedCents - p.paidCents)
          : g === "none"
            ? p.remainingCents
            : p.paidCents;
  }
  return out;
}

/** Junta por dia, na ordem (a consulta já vem por horário). */
export function byDay<T extends DepositItem>(items: T[]): { date: string; items: T[] }[] {
  const days: { date: string; items: T[] }[] = [];
  for (const x of items) {
    const d = todayStr(x.startsAt);
    const last = days.at(-1);
    if (last?.date === d) last.items.push(x);
    else days.push({ date: d, items: [x] });
  }
  return days;
}

/** "Hoje", "Amanhã" ou "Quarta, 25/11". */
export function dayHeading(date: string, now: Date): string {
  const today = todayStr(now);
  if (date === today) return "Hoje";
  if (date === addDays(today, 1)) return "Amanhã";
  const s = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00-03:00`));
  return s.charAt(0).toUpperCase() + s.slice(1).replace("-feira", "");
}
