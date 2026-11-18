// Linhas das views do painel do dono (contrato da seção 4 do plano; nomes em camelCase).

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "read_only" | "canceled" | "expired";
export type PlanKind = "individual" | "empresa";
export type PaymentMethod = "card" | "pix";

export type OverviewRow = {
  tenantId: string;
  salonName: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  planName: string;
  planKind: PlanKind;
  planInterval: "month" | "year";
  status: SubscriptionStatus;
  founder: boolean;
  paymentMethod: PaymentMethod | null;
  seats: number;
  activeProfessionals: number;
  amountCents: number;
  mrrCents: number;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  nextDueAt: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  cancelReason: string | null;
  pastDueSince: Date | null;
  daysPastDue: number | null;
  lastPaidAt: Date | null;
  providerSubscriptionId: string | null;
  createdAt: Date;
};

export type MrrMonthRow = {
  /** Dia 1 do mês, em UTC-3 (YYYY-MM-01). */
  month: string;
  mrrCents: number;
  newCents: number;
  expansionCents: number;
  contractionCents: number;
  churnCents: number;
  reactivationCents: number;
  newCount: number;
  churnCount: number;
};

export type PaymentStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "refunded"
  | "charged_back"
  | "cancelled"
  | "expired";

export type PaymentRow = {
  paymentId: string;
  tenantId: string;
  salonName: string;
  planId: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amountCents: number;
  feeCents: number | null;
  netCents: number | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  failureCode: string | null;
  providerPaymentId: string | null;
  createdAt: Date;
};

export type EventKind =
  | "trial_started"
  | "activated"
  | "upgraded"
  | "downgraded"
  | "seats_changed"
  | "past_due"
  | "read_only"
  | "reactivated"
  | "canceled"
  | "expired";

export type SubscriptionEventRow = {
  tenantId: string;
  salonName: string;
  at: Date;
  kind: EventKind;
  fromPlan: string | null;
  toPlan: string | null;
  fromSeats: number | null;
  toSeats: number | null;
  fromAmountCents: number | null;
  toAmountCents: number | null;
  actor: "system" | "owner" | "admin";
  cancelReason: string | null;
};

export type BillingHealth = {
  lastEventAt: Date | null;
  pendingCount: number;
  failed24h: number;
  oldestPendingAt: Date | null;
};
