// Dados de EXEMPLO do painel do dono (só para teste: as telas usam dados reais desde 23/11).
// Nomes e e-mails são inventados (@exemplo.test). Tudo é calculado a partir de `now`, sem aleatório:
// a mesma data dá sempre os mesmos números (bom para teste e para não "piscar" entre recargas).
import type {
  BillingHealth,
  MrrMonthRow,
  OverviewRow,
  PaymentRow,
  PaymentStatus,
  PlanKind,
  SubscriptionEventRow,
  SubscriptionStatus,
} from "@/features/admin/types";
import { monthKey, shiftMonth } from "@/features/admin/month";

const DAY = 86_400_000;

type Seed = {
  salon: string;
  owner: string;
  status: SubscriptionStatus;
  kind: PlanKind;
  seats: number;
  method: "card" | "pix" | null;
  founder?: boolean;
  courtesy?: boolean;
  annual?: boolean;
  /** Dias desde o cadastro. */
  age: number;
  /** Dia do vencimento, em dias a partir de hoje (negativo = já venceu). */
  due?: number;
  cancelReason?: string;
};

const SEEDS: Seed[] = [
  { salon: "Studio Lírio", owner: "Ana Prado", status: "active", kind: "individual", seats: 1, method: "card", founder: true, age: 120, due: 2 },
  { salon: "Espaço Jasmim", owner: "Bia Torres", status: "active", kind: "empresa", seats: 4, method: "card", age: 95, due: 5 },
  { salon: "Ateliê Camélia", owner: "Carla Nunes", status: "active", kind: "individual", seats: 1, method: "pix", age: 80, due: 11 },
  { salon: "Bella Unhas", owner: "Dani Rocha", status: "past_due", kind: "individual", seats: 1, method: "pix", age: 70, due: -4 },
  { salon: "Casa Íris", owner: "Edu Lima", status: "active", kind: "empresa", seats: 3, method: "card", age: 64, due: 1 },
  { salon: "Nail Bar Orquídea", owner: "Fê Castro", status: "trialing", kind: "individual", seats: 1, method: null, age: 12 },
  { salon: "Salão Magnólia", owner: "Gabi Souza", status: "active", kind: "individual", seats: 1, method: "card", founder: true, courtesy: true, age: 140 },
  { salon: "Studio Violeta", owner: "Helô Dias", status: "past_due", kind: "empresa", seats: 2, method: "card", age: 90, due: -19 },
  { salon: "Espaço Dália", owner: "Iara Melo", status: "trialing", kind: "empresa", seats: 2, method: null, age: 9 },
  { salon: "Ateliê Hortênsia", owner: "Ju Ramos", status: "canceled", kind: "individual", seats: 1, method: "card", age: 110, cancelReason: "Fechou o salão" },
  { salon: "Bella Tulipa", owner: "Kátia Alves", status: "active", kind: "individual", seats: 1, method: "pix", annual: true, age: 200, due: 165 },
  { salon: "Casa Gardênia", owner: "Lu Freitas", status: "read_only", kind: "individual", seats: 1, method: null, age: 30 },
  { salon: "Studio Azaleia", owner: "Mari Costa", status: "active", kind: "empresa", seats: 5, method: "card", founder: true, age: 150, due: 6 },
  { salon: "Nail Bar Begônia", owner: "Nina Reis", status: "trialing", kind: "individual", seats: 1, method: null, age: 5 },
  { salon: "Salão Petúnia", owner: "Olga Pires", status: "active", kind: "individual", seats: 1, method: "card", age: 45, due: 15 },
  { salon: "Espaço Acácia", owner: "Paula Vaz", status: "past_due", kind: "individual", seats: 1, method: "card", age: 160, due: -38 },
  { salon: "Ateliê Lavanda", owner: "Rafa Moura", status: "expired", kind: "individual", seats: 1, method: null, age: 60 },
  { salon: "Bella Prímula", owner: "Sofia Cruz", status: "active", kind: "individual", seats: 1, method: "pix", age: 38, due: 3 },
  { salon: "Casa Cerejeira", owner: "Tati Gomes", status: "trialing", kind: "individual", seats: 1, method: null, age: 13 },
  { salon: "Studio Girassol", owner: "Vivi Lopes", status: "canceled", kind: "empresa", seats: 2, method: "pix", age: 75, cancelReason: "Achou caro" },
  { salon: "Nail Bar Alecrim", owner: "Yara Pinto", status: "active", kind: "empresa", seats: 2, method: "card", age: 25, due: 20 },
  { salon: "Salão Ipê", owner: "Zuza Brito", status: "active", kind: "individual", seats: 1, method: "card", age: 55, due: 9 },
  { salon: "Espaço Margarida", owner: "Alice Faria", status: "trialing", kind: "empresa", seats: 3, method: null, age: 3 },
  { salon: "Ateliê Verbena", owner: "Bruna Sá", status: "active", kind: "individual", seats: 1, method: "pix", age: 20, due: 4 },
];

const PRICE = { individual: 4990, seat: 2990, founder: 3990 } as const;

function monthlyAmount(s: Seed): number {
  if (s.courtesy) return 0;
  const base = s.founder ? PRICE.founder : PRICE.individual;
  return s.kind === "empresa" ? base + (s.seats - 1) * PRICE.seat : base;
}

const id = (i: number) => `demo-${String(i + 1).padStart(2, "0")}`;
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");

export function demoOverview(now: Date): OverviewRow[] {
  const t = now.getTime();
  return SEEDS.map((s, i): OverviewRow => {
    const amount = monthlyAmount(s);
    const yearly = s.annual ? amount * 10 : amount; // anual = 2 meses grátis
    const paid = s.status === "active" || s.status === "past_due";
    const created = new Date(t - s.age * DAY);
    const nextDue = s.due !== undefined && paid ? new Date(t + s.due * DAY) : null;
    const late = s.status === "past_due" && s.due !== undefined ? -s.due : null;
    const ended = s.status === "canceled" || s.status === "expired";
    return {
      tenantId: id(i),
      salonName: s.salon,
      ownerName: s.owner,
      ownerEmail: `${slug(s.owner)}@exemplo.test`,
      planId: `${s.kind}${s.annual ? "-anual" : ""}${s.founder ? "-fundadora" : ""}`,
      planName: `${s.kind === "empresa" ? "Empresa" : "Individual"}${s.annual ? " anual" : ""}${s.founder ? " (Fundadora)" : ""}`,
      planKind: s.kind,
      planInterval: s.annual ? "year" : "month",
      status: s.status,
      founder: !!s.founder,
      paymentMethod: s.method,
      seats: s.seats,
      activeProfessionals: s.kind === "empresa" ? Math.max(1, s.seats - (i % 2)) : 1,
      amountCents: yearly,
      mrrCents: paid ? amount : 0,
      trialEndsAt: s.status === "trialing" ? new Date(created.getTime() + 14 * DAY) : null,
      currentPeriodEnd: nextDue,
      nextDueAt: nextDue,
      cancelAtPeriodEnd: false,
      canceledAt: ended ? new Date(t - (i % 20) * DAY - 2 * DAY) : null,
      cancelReason: s.cancelReason ?? null,
      pastDueSince: late ? new Date(t - late * DAY) : null,
      daysPastDue: late,
      lastPaidAt: paid && amount > 0 ? new Date(t - ((late ?? 0) + 30 - (s.due ?? 0)) * DAY) : null,
      providerSubscriptionId: s.method === "card" && paid && amount > 0 ? `demo-preapproval-${i + 1}` : null,
      createdAt: created,
    };
  });
}

/** 'YYYY-MM' do mês de `d` em UTC-3. */
/** 12 meses de MRR terminando no mês atual, subindo devagar (curva de começo de SaaS). */
export function demoMrr(now: Date): MrrMonthRow[] {
  const current = demoOverview(now).reduce((s, r) => s + r.mrrCents, 0);
  const end = monthKey(now);
  const rows: MrrMonthRow[] = [];
  let prev = 0;
  for (let k = 11; k >= 0; k--) {
    const month = shiftMonth(end, -k);
    const mrr = k === 0 ? current : Math.round((current * Math.pow(11 - k + 1, 1.6)) / Math.pow(12, 1.6) / 10) * 10;
    const churn = k % 4 === 1 ? 4990 : 0;
    const expansion = k % 3 === 0 && k > 0 ? 2990 : 0;
    const newC = Math.max(0, mrr - prev + churn - expansion);
    rows.push({
      month: `${month}-01`,
      mrrCents: mrr,
      newCents: newC,
      expansionCents: expansion,
      contractionCents: 0,
      churnCents: churn,
      reactivationCents: 0,
      newCount: Math.round(newC / 5000),
      churnCount: churn ? 1 : 0,
    });
    prev = mrr;
  }
  return rows;
}

const STATUS_CYCLE: PaymentStatus[] = ["approved", "approved", "approved", "approved", "approved", "pending", "approved", "rejected", "approved", "refunded"];

/** Pagamentos do mês 'YYYY-MM'. Mês futuro: nada. Mês atual: só até hoje. */
export function demoPayments(now: Date, month: string): PaymentRow[] {
  const nowKey = monthKey(now);
  if (month > nowKey) return [];
  const rows = demoOverview(now).filter((r) => r.amountCents > 0 && r.paymentMethod && r.status !== "trialing");
  const [y, m] = month.split("-").map(Number);
  const out: PaymentRow[] = [];
  rows.forEach((r, i) => {
    const day = 1 + ((i * 7 + m) % 27);
    const at = new Date(Date.UTC(y, m - 1, day, 15, 0));
    if (at.getTime() > now.getTime()) return;
    const status = STATUS_CYCLE[(i + m) % STATUS_CYCLE.length];
    const fee = r.paymentMethod === "pix" ? Math.round(r.amountCents * 0.0099) : Math.round(r.amountCents * 0.0498);
    const ok = status === "approved" || status === "refunded";
    out.push({
      paymentId: `demo-pay-${month}-${i + 1}`,
      tenantId: r.tenantId,
      salonName: r.salonName,
      planId: r.planId,
      method: r.paymentMethod!,
      status,
      amountCents: r.amountCents,
      feeCents: ok ? fee : null,
      netCents: ok ? r.amountCents - fee : null,
      periodStart: at,
      periodEnd: new Date(at.getTime() + 30 * DAY),
      dueAt: at,
      paidAt: ok ? at : null,
      failureCode: status === "rejected" ? "cc_rejected_insufficient_amount" : null,
      providerPaymentId: `demo-mp-${y}${m}${i + 1}`,
      createdAt: at,
    });
  });
  return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Eventos dos últimos 90 dias: fim de teste (pagou ou não) e cancelamentos. */
export function demoEvents(now: Date): SubscriptionEventRow[] {
  const t = now.getTime();
  const rows = demoOverview(now);
  const ev: SubscriptionEventRow[] = [];
  rows.forEach((r) => {
    const trialEnd = new Date(r.createdAt.getTime() + 14 * DAY);
    if (trialEnd.getTime() > t) return;
    const base = { tenantId: r.tenantId, salonName: r.salonName, fromPlan: null, toPlan: r.planId, fromSeats: null, toSeats: r.seats, fromAmountCents: null, toAmountCents: r.amountCents, actor: "system" as const, cancelReason: null };
    ev.push({ ...base, at: trialEnd, kind: r.status === "read_only" || r.status === "expired" ? "read_only" : "activated" });
    if (r.canceledAt) ev.push({ ...base, at: r.canceledAt, kind: "canceled", actor: "owner", cancelReason: r.cancelReason });
  });
  return ev.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function demoHealth(now: Date): BillingHealth {
  return { lastEventAt: new Date(now.getTime() - 40 * 60_000), pendingCount: 0, failed24h: 0, oldestPendingAt: null };
}
