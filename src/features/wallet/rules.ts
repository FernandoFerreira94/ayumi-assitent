/**
 * Carteira da cliente: regras puras (sem banco). O extrato (`client_ledger`) só recebe inserções; tudo aqui é
 * soma de movimentos. Anulação = movimento do mesmo tipo com valor negativo, então as somas já a descontam.
 * Pagamento manual da cliente do salão (sem gateway); não é a cobrança do Bubbly.
 */

import { applyDiscount, type Discount } from "@/features/appointments/pricing";

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
  /** serviços em que a sessão vale (1 ou mais) */
  serviceIds: string[];
  sessionsPaid: number | null;
  sessionsTotal: number;
  priceCents: number;
  /** período de venda (YYYY-MM-DD) e "as N primeiras clientes"; null = sem */
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
  /** pacote de sessões com preço por desconto (% ou R$ sobre sessões × valor do serviço); null = preço digitado */
  discount?: Discount | null;
};

/** Preço do modelo: "Pague X, leve Y" = X × valor do serviço; pacote de sessões = o preço digitado. */
export const packagePrice = (
  d: Pick<PackageDraft, "kind" | "sessionsPaid" | "priceCents"> &
    Partial<Pick<PackageDraft, "sessionsTotal" | "discount">>,
  unitCents: number,
) =>
  d.kind === "pay_x"
    ? payXPrice(d.sessionsPaid ?? 0, unitCents)
    : d.discount
      ? applyDiscount((d.sessionsTotal ?? 0) * unitCents, d.discount).totalCents
      : d.priceCents;

/** Percentual de desconto (arredondado) de `priceCents` sobre o valor cheio; 0 sem desconto. */
export const offPct = (fullCents: number, priceCents: number) =>
  fullCents > 0 && priceCents < fullCents ? Math.round(((fullCents - priceCents) * 100) / fullCents) : 0;

/** Serviço de referência do preço: o mais caro da lista (no "Pague X, leve Y" o salão nunca perde). */
export const referenceService = <T extends { priceCents: number }>(list: readonly T[]): T | undefined =>
  list.reduce<T | undefined>((a, b) => (!a || b.priceCents > a.priceCents ? b : a), undefined);

/** "Esmaltação", "Esmaltação ou Pé" ou "Esmaltação, Pé ou Mão". */
export const serviceNames = (names: readonly string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} ou ${names[names.length - 1]}`;

/** Frase pronta do modelo (prévia na hora de criar e na venda). */
export function packagePreview(
  d: Pick<PackageDraft, "kind" | "sessionsPaid" | "sessionsTotal" | "priceCents">,
  services: readonly { name: string; priceCents: number }[],
  validDays: number,
  brl: (cents: number) => string,
): string {
  const ref = referenceService(services) ?? { name: "", priceCents: 0 };
  const price = packagePrice(d, ref.priceCents);
  const full = d.sessionsTotal * ref.priceCents;
  const save = full - price;
  const what = `${d.sessionsTotal} ${d.sessionsTotal === 1 ? "sessão" : "sessões"} de ${serviceNames(services.map((s) => s.name))}`;
  const lead = d.kind === "pay_x" ? `Paga ${d.sessionsPaid} e leva ${d.sessionsTotal}: ` : "";
  return `${lead}cliente paga ${brl(price)} e ganha ${what}${save > 0 ? ` (economiza ${brl(save)})` : ""}. Vale ${validDays} dias.`;
}

/** Nome automático do pacote, quando a dona não dá um ("Pague 3 leve 4 Esmaltação"). */
export const autoPackageName = (
  d: Pick<PackageDraft, "kind" | "sessionsPaid" | "sessionsTotal">,
  names: readonly string[],
) =>
  (d.kind === "pay_x"
    ? `Pague ${d.sessionsPaid} leve ${d.sessionsTotal} ${serviceNames(names)}`
    : `${d.sessionsTotal} sessões de ${serviceNames(names)}`
  ).slice(0, 80);

/** "2030-12-01" → "01/12" (linha da promoção). */
export const dayMonth = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export type PromoStatus = "scheduled" | "running" | "ended" | "sold_out" | "paused";

/** Situação da promoção hoje: ainda não começou, valendo, acabou o período ou esgotou o limite. */
export function promoStatus(
  t: Pick<PackageDraft, "startsOn" | "endsOn" | "maxClients"> & { paused?: boolean },
  today: string,
  soldClients: number,
): PromoStatus {
  if (t.endsOn && today > t.endsOn) return "ended";
  if (t.maxClients !== null && soldClients >= t.maxClients) return "sold_out";
  if (t.paused) return "paused";
  if (t.startsOn && today < t.startsOn) return "scheduled";
  return "running";
}

/**
 * Linha da promoção: "De 01/12 a 31/12 · 12 de 30 clientes" (soldClients null, na criação: "para as 30
 * primeiras clientes"). Vazia quando não há período nem limite.
 */
export function promoLine(
  t: Pick<PackageDraft, "startsOn" | "endsOn" | "maxClients">,
  soldClients: number | null,
  fmt: (day: string) => string,
): string {
  const when =
    t.startsOn && t.endsOn
      ? `De ${fmt(t.startsOn)} a ${fmt(t.endsOn)}`
      : t.startsOn
        ? `A partir de ${fmt(t.startsOn)}`
        : t.endsOn
          ? `Até ${fmt(t.endsOn)}`
          : "";
  const cap =
    t.maxClients === null
      ? ""
      : soldClients === null
        ? `${when ? "para" : "Para"} as ${t.maxClients} primeiras clientes`
        : `${soldClients} de ${t.maxClients} clientes`;
  return [when, cap].filter(Boolean).join(" · ");
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

/** Lê o formulário do modelo de pacote. Devolve o campo errado quando algo não fecha. */
export function parsePackageDraft(raw: {
  kind?: string;
  name?: string;
  serviceIds?: string[];
  sessionsPaid?: string;
  sessionsTotal?: string;
  priceCents?: number | null;
  startsOn?: string;
  endsOn?: string;
  maxClients?: string;
  /** desconto no lugar do preço (pacote de sessões) */
  discount?: Discount | null;
}): { ok: true; draft: PackageDraft } | { ok: false; field: string } {
  const kind = raw.kind === "pay_x" || raw.kind === "sessions" ? raw.kind : null;
  if (!kind) return { ok: false, field: "kind" };
  const name = (raw.name ?? "").trim();
  if (name.length < 1 || name.length > 80) return { ok: false, field: "name" };
  const serviceIds = [...new Set(raw.serviceIds ?? [])];
  if (serviceIds.length < 1 || serviceIds.length > 30 || !serviceIds.every((id) => UUID.test(id)))
    return { ok: false, field: "serviceIds" };
  const total = Number(raw.sessionsTotal);
  if (!Number.isInteger(total) || total < 1 || total > 100) return { ok: false, field: "sessionsTotal" };
  const startsOn = raw.startsOn?.trim() || null;
  const endsOn = raw.endsOn?.trim() || null;
  if (startsOn && !DAY.test(startsOn)) return { ok: false, field: "startsOn" };
  if (endsOn && (!DAY.test(endsOn) || (startsOn && endsOn < startsOn))) return { ok: false, field: "endsOn" };
  const capRaw = raw.maxClients?.trim();
  const maxClients = capRaw ? Number(capRaw) : null;
  if (maxClients !== null && (!Number.isInteger(maxClients) || maxClients < 1 || maxClients > 10_000))
    return { ok: false, field: "maxClients" };
  const base = { kind: kind as PackageKind, name, serviceIds, sessionsTotal: total, startsOn, endsOn, maxClients };
  if (kind === "pay_x") {
    const paid = Number(raw.sessionsPaid);
    if (!Number.isInteger(paid) || paid < 1 || paid >= total) return { ok: false, field: "sessionsPaid" };
    return { ok: true, draft: { ...base, sessionsPaid: paid, priceCents: 0 } };
  }
  if (raw.discount) {
    const v = raw.discount.value;
    const okPct = raw.discount.kind === "pct" && Number.isInteger(v) && v >= 1 && v <= 99;
    const okBrl = raw.discount.kind === "brl" && Number.isInteger(v) && v >= 1 && v < 10_000_000;
    if (!okPct && !okBrl) return { ok: false, field: "priceCents" };
    return { ok: true, draft: { ...base, sessionsPaid: null, priceCents: 0, discount: raw.discount } };
  }
  const price = raw.priceCents;
  if (price == null || !Number.isInteger(price) || price < 0 || price > 10_000_000)
    return { ok: false, field: "priceCents" };
  return { ok: true, draft: { ...base, sessionsPaid: null, priceCents: price } };
}

export type OfferEdit = { name: string; startsOn: string | null; endsOn: string | null; maxClients: number | null };

/** Editar um pacote à venda: nome, período e limite (sessões e preço ficam; quem comprou guarda a cópia). */
export function parseOfferEdit(raw: {
  name?: string;
  startsOn?: string;
  endsOn?: string;
  maxClients?: string;
}): { ok: true; edit: OfferEdit } | { ok: false; field: string } {
  const name = (raw.name ?? "").trim();
  if (name.length < 1 || name.length > 80) return { ok: false, field: "name" };
  const startsOn = raw.startsOn?.trim() || null;
  const endsOn = raw.endsOn?.trim() || null;
  if (startsOn && !DAY.test(startsOn)) return { ok: false, field: "startsOn" };
  if (endsOn && (!DAY.test(endsOn) || (startsOn && endsOn < startsOn))) return { ok: false, field: "endsOn" };
  const capRaw = raw.maxClients?.trim();
  const maxClients = capRaw ? Number(capRaw) : null;
  if (maxClients !== null && (!Number.isInteger(maxClients) || maxClients < 1 || maxClients > 10_000))
    return { ok: false, field: "maxClients" };
  return { ok: true, edit: { name, startsOn, endsOn, maxClients } };
}

/** O que "Excluir" faz: nunca usado = apaga de vez; já vendido/usado = sai da lista e o histórico fica. */
export type DeleteOutcome = "deleted" | "archived";

/** Palavra que a dona digita para liberar o Excluir (igual ao Excluir conta). */
export const DELETE_WORD = "excluir";
export const isDeleteWord = (typed: string) => typed.trim().toLowerCase() === DELETE_WORD;

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

export type GuideStep = { icon: "coins" | "wallet" | "checkCircle"; title: string; text: string };
export type GuideOutcome = { when: string; result: string; tone: "ok" | "keep" | "same" };
export type WalletGuide = { steps: GuideStep[]; outcomes: GuideOutcome[]; notes: string[] };

/**
 * "Como funciona" em poucas palavras, com a política do salão: o caminho do agendamento (3 passos), o que
 * acontece em cada situação e 3 lembretes. Mostrado em Ajustes > Pagamentos e no Financeiro.
 */
export function walletGuide(p: WalletPolicy): WalletGuide {
  const keep = "Sinal fica · resto vira crédito";
  return {
    steps: [
      { icon: "coins", title: "Agendou", text: `Sinal opcional (${p.depositPct}%). O resto fica a pagar.` },
      { icon: "wallet", title: "Tem crédito ou pacote?", text: "O app usa sozinho." },
      { icon: "checkCircle", title: "Concluiu", text: "Entra nos Ganhos." },
    ],
    outcomes: [
      { when: `Cancelou com ${p.cancelNoticeHours}h ou mais`, result: "Vira crédito", tone: "ok" },
      {
        when: "Cancelou em cima da hora",
        result: p.lateCancelKeepsDeposit ? keep : "Vira crédito",
        tone: p.lateCancelKeepsDeposit ? "keep" : "ok",
      },
      {
        when: "Faltou",
        result: p.noShowKeepsDeposit ? keep : "Vira crédito",
        tone: p.noShowKeepsDeposit ? "keep" : "ok",
      },
      {
        when: "Faltou com pacote",
        result: p.noShowUsesSession ? "Sessão conta como usada" : "Sessão volta",
        tone: p.noShowUsesSession ? "keep" : "ok",
      },
      { when: "Cancelou com pacote", result: "Sessão volta", tone: "ok" },
      { when: "Remarcou", result: "Nada muda", tone: "same" },
    ],
    notes: [
      "Crédito nunca vence. Para devolver: ficha da cliente > Devolver.",
      `Pacote vale ${p.packageValidDays} dias e entra no caixa na venda.`,
      "Caixa = dinheiro que entrou no mês, menos devoluções.",
    ],
  };
}
