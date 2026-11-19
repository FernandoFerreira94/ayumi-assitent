/**
 * Carteira da cliente: regras puras (sem banco). O extrato (`client_ledger`) só recebe inserções; tudo aqui é
 * soma de movimentos. Anulação = movimento do mesmo tipo com valor negativo, então as somas já a descontam.
 * Pagamento manual da cliente do salão (sem gateway); não é a cobrança do Bubbly.
 */

export const LEDGER_KINDS = [
  "payment",
  "refund",
  "credit_in",
  "credit_use",
  "retained",
  "expire",
  "session_grant",
  "session_reserve",
  "session_use",
  "session_return",
] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

export type Move = {
  kind: LedgerKind;
  amountCents: number;
  /** null = movimento da carteira (sem atendimento) */
  appointmentId: string | null;
};

/** Quanto do atendimento já está pago: pagamentos e crédito usado, menos devolvido, retido ou passado ao crédito. */
export function appointmentPaid(moves: readonly Move[], appointmentId: string): number {
  let paid = 0;
  for (const m of moves) {
    if (m.appointmentId !== appointmentId) continue;
    if (m.kind === "payment" || m.kind === "credit_use") paid += m.amountCents;
    else if (m.kind === "refund" || m.kind === "credit_in" || m.kind === "retained") paid -= m.amountCents;
  }
  return paid;
}

/**
 * Crédito da cliente (dinheiro dela guardado no salão). Entra: pagamento sem atendimento e o que um atendimento
 * passou ao crédito. Sai: crédito usado, devolução/retenção sem atendimento e vencimento.
 */
export function walletBalance(moves: readonly Move[]): number {
  let bal = 0;
  for (const m of moves) {
    if (m.kind === "credit_in") bal += m.amountCents;
    else if (m.kind === "credit_use" || m.kind === "expire") bal -= m.amountCents;
    else if (m.appointmentId === null) {
      if (m.kind === "payment") bal += m.amountCents;
      else if (m.kind === "refund" || m.kind === "retained") bal -= m.amountCents;
    }
  }
  return bal;
}

/** Dinheiro que entrou no caixa: pagamentos menos devoluções (a data é a do movimento). */
export function cashIn(moves: readonly Move[]): number {
  let cash = 0;
  for (const m of moves) {
    if (m.kind === "payment") cash += m.amountCents;
    else if (m.kind === "refund") cash -= m.amountCents;
  }
  return cash;
}

/** Quanto falta pagar do atendimento (nunca negativo). */
export const remainingCents = (totalCents: number, paidCents: number) => Math.max(0, totalCents - paidCents);

/**
 * Sinal sugerido: `pct`% do total, arredondado para reais inteiros (R$ 29,70 → R$ 30), no mínimo R$ 1 e
 * nunca mais que o total.
 */
export function suggestedDeposit(totalCents: number, pct: number): number {
  if (totalCents <= 0) return 0;
  const raw = Math.round((totalCents * pct) / 100 / 100) * 100;
  return Math.min(totalCents, Math.max(100, raw));
}

export type WalletPolicy = {
  depositPct: number;
  cancelNoticeHours: number;
  lateCancelKeepsDeposit: boolean;
  noShowKeepsDeposit: boolean;
  noShowUsesSession: boolean;
  packageValidDays: number;
};

/** Padrões aprovados em 19/11/2026 (decisões D1, D2, D4 e D5). */
export const DEFAULT_POLICY: WalletPolicy = {
  depositPct: 30,
  cancelNoticeHours: 24,
  lateCancelKeepsDeposit: true,
  noShowKeepsDeposit: true,
  noShowUsesSession: true,
  packageValidDays: 90,
};

export type Outcome = {
  /** Vai para o crédito da cliente */
  toCredit: number;
  /** Fica para o salão (taxa de cancelamento/falta) */
  retained: number;
  /** Sessão do pacote volta para a cliente */
  sessionBack: boolean;
  /** Cancelou com menos antecedência que a política */
  late: boolean;
};

/**
 * O que acontece com o que foi pago quando o atendimento é cancelado ou a cliente falta.
 * Cancelou com antecedência: tudo vira crédito e a sessão volta. Em cima da hora (ou faltou), se a política manda,
 * o sinal (o sugerido, limitado ao que foi pago) fica para o salão e o resto vira crédito.
 */
export function cancelOutcome(input: {
  policy: WalletPolicy;
  status: "cancelled" | "no_show";
  startsAt: Date;
  at: Date;
  totalCents: number;
  paidCents: number;
}): Outcome {
  const { policy, status, startsAt, at, totalCents } = input;
  const paid = Math.max(0, input.paidCents);
  const late = status === "no_show" || startsAt.getTime() - at.getTime() < policy.cancelNoticeHours * 3_600_000;
  const keeps = status === "no_show" ? policy.noShowKeepsDeposit : late && policy.lateCancelKeepsDeposit;
  const retained = keeps ? Math.min(paid, suggestedDeposit(totalCents, policy.depositPct)) : 0;
  return {
    toCredit: paid - retained,
    retained,
    sessionBack: status === "cancelled" || !policy.noShowUsesSession,
    late,
  };
}

/** Preço do "Pague X, leve Y": X vezes o valor do serviço. */
export const payXPrice = (paidSessions: number, unitCents: number) => paidSessions * unitCents;

/**
 * Valor de cada sessão de um pacote para os Ganhos (preço ÷ sessões). A sobra dos centavos vai na última sessão,
 * para a soma bater com o preço: 13500 em 4 = 3375, 3375, 3375, 3375; 10000 em 3 = 3333, 3333, 3334.
 */
export function sessionValue(priceCents: number, sessions: number, index: number): number {
  const base = Math.floor(priceCents / sessions);
  return index === sessions - 1 ? priceCents - base * (sessions - 1) : base;
}

/** Validade do pacote: dia da venda + `days` (datas YYYY-MM-DD do calendário do estúdio). */
export function packageExpiresOn(soldOn: string, days: number): string {
  const d = new Date(`${soldOn}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lê o formulário de Ajustes > Pagamentos. Devolve o campo errado quando algo não fecha. */
export function parsePolicy(
  input: Record<string, string | undefined>,
): { ok: true; policy: WalletPolicy; pixKey: string | null } | { ok: false; field: string } {
  const int = (v: string | undefined) => (v && /^\d{1,4}$/.test(v) ? Number(v) : NaN);
  const depositPct = int(input.depositPct);
  if (!(depositPct >= 5 && depositPct <= 100)) return { ok: false, field: "depositPct" };
  const cancelNoticeHours = int(input.cancelNoticeHours);
  if (!(cancelNoticeHours >= 0 && cancelNoticeHours <= 168)) return { ok: false, field: "cancelNoticeHours" };
  const packageValidDays = int(input.packageValidDays);
  if (!(packageValidDays >= 7 && packageValidDays <= 730)) return { ok: false, field: "packageValidDays" };
  const pix = (input.pixKey ?? "").trim();
  if (pix.length > 140) return { ok: false, field: "pixKey" };
  return {
    ok: true,
    pixKey: pix || null,
    policy: {
      depositPct,
      cancelNoticeHours,
      packageValidDays,
      lateCancelKeepsDeposit: input.lateCancelKeepsDeposit === "on",
      noShowKeepsDeposit: input.noShowKeepsDeposit === "on",
      noShowUsesSession: input.noShowUsesSession === "on",
    },
  };
}
