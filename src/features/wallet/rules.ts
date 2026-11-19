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
  /** Pacote da cliente (venda, sessões); a venda de pacote não entra no crédito */
  clientPackageId?: string | null;
  sessions?: number;
};

/** Quanto do atendimento já está pago: pagamentos e crédito usado, menos devolvido, retido ou passado ao crédito. */
export function appointmentPaid(moves: readonly Move[], appointmentId: string): number {
  let paid = 0;
  for (const m of moves) {
    if (m.appointmentId !== appointmentId) continue;
    if (m.kind === "payment" || m.kind === "credit_use" || m.kind === "session_reserve") paid += m.amountCents;
    else if (m.kind === "refund" || m.kind === "credit_in" || m.kind === "retained" || m.kind === "session_return")
      paid -= m.amountCents;
  }
  return paid;
}

/** Efeito de um movimento no crédito da cliente (0 = não mexe no crédito). */
export function walletEffect(m: Move): number {
  if (m.kind === "credit_in") return m.amountCents;
  if (m.kind === "credit_use" || m.kind === "expire") return -m.amountCents;
  if (m.appointmentId === null && !m.clientPackageId) {
    if (m.kind === "payment") return m.amountCents;
    if (m.kind === "refund" || m.kind === "retained") return -m.amountCents;
  }
  return 0;
}

/**
 * Crédito da cliente (dinheiro dela guardado no salão). Entra: pagamento sem atendimento e o que um atendimento
 * passou ao crédito. Sai: crédito usado, devolução/retenção sem atendimento e vencimento.
 */
export const walletBalance = (moves: readonly Move[]) => moves.reduce((t, m) => t + walletEffect(m), 0);

const WALLET_LABEL: Partial<Record<LedgerKind, string>> = {
  credit_in: "Virou crédito",
  credit_use: "Usado no agendamento",
  expire: "Venceu",
  payment: "Crédito lançado",
  refund: "Devolvido",
  retained: "Ficou para o salão",
};

/** Extrato do crédito para a ficha: só o que mexe no crédito, o mais novo primeiro. */
export function walletStatement<T extends Move & { reason: string | null; occurredAt: Date }>(
  moves: readonly T[],
  limit = 10,
): { at: Date; label: string; cents: number }[] {
  return moves
    .map((m) => ({ at: m.occurredAt, label: m.reason || WALLET_LABEL[m.kind] || m.kind, cents: walletEffect(m) }))
    .filter((m) => m.cents !== 0)
    .reverse()
    .slice(0, limit);
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

/** Sessões que ainda dá para usar no pacote: vendidas − reservadas + devolvidas. */
export function packageSessionsLeft(moves: readonly Move[], clientPackageId: string): number {
  let left = 0;
  for (const m of moves) {
    if (m.clientPackageId !== clientPackageId) continue;
    const n = m.sessions ?? 0;
    if (m.kind === "session_grant" || m.kind === "session_return") left += n;
    else if (m.kind === "session_reserve" || m.kind === "expire") left -= n;
  }
  return left;
}

export type PackageKind = "pay_x" | "sessions";
export type PackageDraft = {
  kind: PackageKind;
  name: string;
  serviceId: string;
  sessionsPaid: number | null;
  sessionsTotal: number;
  priceCents: number;
};

/** Preço do modelo: "Pague X, leve Y" = X × valor do serviço; pacote de sessões = o preço digitado. */
export const packagePrice = (d: Pick<PackageDraft, "kind" | "sessionsPaid" | "priceCents">, unitCents: number) =>
  d.kind === "pay_x" ? payXPrice(d.sessionsPaid ?? 0, unitCents) : d.priceCents;

/** Frase pronta do modelo (prévia na hora de criar e na venda). */
export function packagePreview(
  d: Pick<PackageDraft, "kind" | "sessionsPaid" | "sessionsTotal" | "priceCents">,
  service: { name: string; priceCents: number },
  validDays: number,
  brl: (cents: number) => string,
): string {
  const price = packagePrice(d, service.priceCents);
  const full = d.sessionsTotal * service.priceCents;
  const save = full - price;
  const what = `${d.sessionsTotal} ${d.sessionsTotal === 1 ? "sessão" : "sessões"} de ${service.name}`;
  const lead = d.kind === "pay_x" ? `Paga ${d.sessionsPaid} e leva ${d.sessionsTotal}: ` : "";
  return `${lead}cliente paga ${brl(price)} e ganha ${what}${save > 0 ? ` (economiza ${brl(save)})` : ""}. Vale ${validDays} dias.`;
}

/** Lê o formulário do modelo de pacote. Devolve o campo errado quando algo não fecha. */
export function parsePackageDraft(raw: {
  kind?: string;
  name?: string;
  serviceId?: string;
  sessionsPaid?: string;
  sessionsTotal?: string;
  priceCents?: number | null;
}): { ok: true; draft: PackageDraft } | { ok: false; field: string } {
  const kind = raw.kind === "pay_x" || raw.kind === "sessions" ? raw.kind : null;
  if (!kind) return { ok: false, field: "kind" };
  const name = (raw.name ?? "").trim();
  if (name.length < 1 || name.length > 80) return { ok: false, field: "name" };
  if (!raw.serviceId || !/^[0-9a-f-]{36}$/i.test(raw.serviceId)) return { ok: false, field: "serviceId" };
  const total = Number(raw.sessionsTotal);
  if (!Number.isInteger(total) || total < 1 || total > 100) return { ok: false, field: "sessionsTotal" };
  if (kind === "pay_x") {
    const paid = Number(raw.sessionsPaid);
    if (!Number.isInteger(paid) || paid < 1 || paid >= total) return { ok: false, field: "sessionsPaid" };
    return {
      ok: true,
      draft: { kind, name, serviceId: raw.serviceId, sessionsPaid: paid, sessionsTotal: total, priceCents: 0 },
    };
  }
  const price = raw.priceCents;
  if (price == null || !Number.isInteger(price) || price < 0 || price > 10_000_000)
    return { ok: false, field: "priceCents" };
  return {
    ok: true,
    draft: { kind, name, serviceId: raw.serviceId, sessionsPaid: null, sessionsTotal: total, priceCents: price },
  };
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
