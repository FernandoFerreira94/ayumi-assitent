"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { visitHistory } from "@/features/returns/rules";
import { formatBRL, formatDayTitle, formatMonthYear, formatShortDate, formatTime, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import {
  bulkDeletePreview,
  clientSummary,
  deleteClientRow,
  deleteClientRows,
  HISTORY,
  insertClient,
  updateClientRow,
} from "./core";
import { clientMoves } from "@/features/wallet/core";
import { clientPackageList } from "@/features/wallet/packages";
import { walletBalance, walletStatement } from "@/features/wallet/rules";
import { BULK_DELETE_MAX, clientInput } from "./schema";
import { clientHistoryPage, clientHistorySummary, type HistoryEvent } from "./history";
import {
  attendanceRate,
  decodeCursor,
  HISTORY_FILTERS,
  METHOD_LABEL,
  moneyLabel,
  moneySign,
  STATUS_LABEL,
  statusTone,
  visitPaymentLine,
  type HistoryFilter,
  type Tone,
} from "./history-rules";

export async function createClient(_prev: ActionResult<{ id: string }> | null, formData: FormData) {
  const { tenantId } = await requireTenant();
  const parsed = clientInput.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => insertClient(tx, tenantId, parsed.data));
    // Planos também lista as clientes (vender pacote)
    if (res.ok) for (const p of ["/clientes", "/planos"]) revalidatePath(p);
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function updateClient(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = clientInput.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => updateClientRow(tx, id, parsed.data));
    if (res.ok) revalidatePath("/clientes");
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    const res = await withTenant(tenantId, (tx) => deleteClientRow(tx, id));
    if (res.ok) revalidatePath("/clientes");
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

const UUID = /^[0-9a-f-]{36}$/i;
const validIds = (ids: unknown): ids is string[] =>
  Array.isArray(ids) &&
  ids.length > 0 &&
  ids.length <= BULK_DELETE_MAX &&
  ids.every((id) => typeof id === "string" && UUID.test(id));

export type BulkDeletePreview = { found: number; anonymize: number; future: number };

/** Para o diálogo de confirmação: quantas saem de vez, quantas viram "Cliente removida". */
export async function previewDeleteClients(ids: string[]): Promise<ActionResult<BulkDeletePreview>> {
  const { tenantId } = await requireTenant();
  if (!validIds(ids)) return fail("VALIDATION");
  try {
    return ok(await withTenant(tenantId, (tx) => bulkDeletePreview(tx, [...new Set(ids)])));
  } catch {
    return fail("UNKNOWN");
  }
}

export type BulkDeleteResult = { removed: number; anonymized: number; failed: number };

/** Exclusão em lote (até BULK_DELETE_MAX por vez), com resultado parcial. */
export async function deleteClients(ids: string[]): Promise<ActionResult<BulkDeleteResult>> {
  const { tenantId } = await requireTenant();
  if (!validIds(ids)) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) => deleteClientRows(tx, ids));
    if (res.removed + res.anonymized > 0) revalidatePath("/clientes");
    return ok(res);
  } catch {
    return fail("UNKNOWN");
  }
}

export type ClientCard = {
  next: { when: string; service: string } | null;
  last: string | null;
  visits: number;
  spentCents: number;
  noShows: number;
  /** últimas visitas concluídas, a mais recente primeiro */
  history: { day: string; service: string; gapDays: number | null }[];
  /** média de dias entre as visitas do histórico */
  averageGap: number | null;
  /** retorno previsto da última visita (sem horário marcado e sem "Não precisa") */
  ret: { appointmentId: string; day: string; service: string; late: boolean } | null;
  /** Carteira: crédito da cliente e os últimos movimentos dele */
  wallet: { balanceCents: number; moves: { day: string; label: string; cents: number }[] };
  /** Pacotes da cliente (os que ainda têm sessão ou venceram há pouco aparecem primeiro) */
  packages: { id: string; name: string; left: number; total: number; until: string | null; expired: boolean }[];
};

/** Dados do cartão da cliente, já em texto para a tela (o fuso é o do servidor, igual à agenda). */
export async function loadClientCard(id: string): Promise<ActionResult<ClientCard>> {
  const { tenantId } = await requireTenant();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("VALIDATION");
  try {
    const [s, moves, pkgs] = await withTenant(
      tenantId,
      async (tx) =>
        [await clientSummary(tx, id), await clientMoves(tx, id), await clientPackageList(tx, id, todayStr())] as const,
    );
    const day = (d: Date) => formatDayTitle(todayStr(d));
    const { visits, averageGap } = visitHistory(
      s.history.map((v) => ({ date: todayStr(v.startsAt), service: v.service })),
      HISTORY,
    );
    return ok({
      next: s.next
        ? { when: `${day(s.next.startsAt)} às ${formatTime(s.next.startsAt)}`, service: s.next.service }
        : null,
      last: s.last ? day(s.last.startsAt) : null,
      visits: s.visits,
      spentCents: s.spentCents,
      noShows: s.noShows,
      history: visits.map((v) => ({ day: formatShortDate(v.date), service: v.service, gapDays: v.gapDays })),
      averageGap,
      // com horário marcado, o retorno já está resolvido
      ret:
        s.ret && !s.next
          ? {
              appointmentId: s.ret.appointmentId,
              day: formatShortDate(s.ret.due),
              service: s.ret.service,
              late: s.ret.due < todayStr(),
            }
          : null,
      wallet: {
        balanceCents: walletBalance(moves),
        moves: walletStatement(moves).map((m) => ({
          day: formatShortDate(todayStr(m.at)),
          label: m.label,
          cents: m.cents,
        })),
      },
      packages: pkgs
        .filter((p) => p.left > 0 && !p.expired)
        .map((p) => ({
          id: p.id,
          name: p.name,
          left: p.left,
          total: p.sessionsTotal,
          until: p.expiresOn ? formatShortDate(p.expiresOn) : null,
          expired: p.expired,
        })),
    });
  } catch {
    return fail("UNKNOWN");
  }
}

export type HistoryItem = {
  key: string;
  /** "Novembro de 2026": cabeçalho do mês na lista */
  month: string;
  /** "sáb., 8 de nov. · 14:00" */
  when: string;
  kind: "visit" | "package" | "money";
  title: string;
  /** linha de baixo (serviço, pacote, forma de pagamento, observação) */
  detail: string | null;
  badge: { text: string; tone: Tone } | null;
  /** selo extra (pagamento do atendimento, plano usado) */
  tags: { text: string; tone: Tone }[];
  /** valor à direita ("R$ 50,00", "+R$ 20,00") */
  amount: string | null;
  amountTone: Tone | null;
};

export type HistoryHeader = {
  since: string | null;
  done: number;
  noShows: number;
  cancelled: number;
  spent: string;
  attendance: number | null;
  lastVisit: string | null;
  next: string | null;
  credit: string | null;
  plans: { name: string; left: number; total: number; until: string | null }[];
};

export type HistoryPage = { summary: HistoryHeader | null; items: HistoryItem[]; next: string | null };

const shortWhen = (d: Date) => `${formatShortDate(todayStr(d))} · ${formatTime(d)}`;

function toItem(e: HistoryEvent, now: Date): HistoryItem {
  const base = { key: `${e.type}:${e.id}`, month: formatMonthYear(todayStr(e.at)), when: shortWhen(e.at) };
  if (e.type === "visit") {
    const pay = visitPaymentLine(e.status, e.priceCents, e.paidCents, formatBRL);
    const tags: HistoryItem["tags"] = [];
    if (pay) tags.push(pay);
    if (e.depositRequestedCents && e.paidCents < e.depositRequestedCents && pay?.text !== "Pago")
      tags.push({ text: `Sinal pedido ${formatBRL(e.depositRequestedCents)}`, tone: "wait" });
    if (e.packageName) tags.push({ text: `Plano: ${e.packageName}`, tone: "info" });
    if (e.promotionName) tags.push({ text: `Promoção: ${e.promotionName}`, tone: "info" });
    else if (e.discountCents > 0) tags.push({ text: `Desconto ${formatBRL(e.discountCents)}`, tone: "info" });
    const future = e.at > now;
    return {
      ...base,
      kind: "visit",
      title: e.service,
      detail: e.notes,
      badge: {
        text: future && e.status !== "cancelled" ? `Marcado · ${STATUS_LABEL[e.status]}` : STATUS_LABEL[e.status],
        tone: statusTone(e.status, future),
      },
      tags,
      amount: formatBRL(e.priceCents),
      amountTone: e.status === "cancelled" || e.status === "no_show" ? "muted" : null,
    };
  }
  if (e.type === "package") {
    return {
      ...base,
      kind: "package",
      title: `Comprou o pacote ${e.name}`,
      detail: `${e.sessionsTotal} ${e.sessionsTotal === 1 ? "sessão" : "sessões"}${e.expiresOn ? ` · vale até ${formatShortDate(e.expiresOn)}` : ""}`,
      badge: { text: "Plano", tone: "info" },
      tags: [],
      amount: formatBRL(e.priceCents),
      amountTone: null,
    };
  }
  const sign = moneySign(e.kind);
  const detail = [
    e.method ? METHOD_LABEL[e.method] : null,
    e.appointmentAt ? `atendimento de ${formatShortDate(todayStr(e.appointmentAt))}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    ...base,
    kind: "money",
    title: moneyLabel(e),
    detail: detail || null,
    badge: null,
    tags: [],
    amount: `${sign > 0 ? "+" : "−"}${formatBRL(Math.abs(e.amountCents))}`,
    amountTone: sign > 0 ? "ok" : "fail",
  };
}

/**
 * Histórico completo da cliente, aos poucos (`cursor` = onde a página anterior parou).
 * O resumo do topo só vem na primeira página. RLS garante que só sai dado do próprio salão.
 */
export async function loadClientHistory(
  id: string,
  filter: string,
  cursor: string | null,
): Promise<ActionResult<HistoryPage>> {
  const { tenantId } = await requireTenant();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("VALIDATION");
  const f = (HISTORY_FILTERS as readonly string[]).includes(filter) ? (filter as HistoryFilter) : "all";
  const c = decodeCursor(cursor);
  if (cursor && !c) return fail("VALIDATION");
  const now = new Date();
  try {
    const res = await withTenant(tenantId, async (tx) => {
      const summary = c ? undefined : await clientHistorySummary(tx, id, todayStr(now), now);
      if (summary === null) return null;
      return { summary, page: await clientHistoryPage(tx, id, f, c) };
    });
    if (!res) return fail("NOT_FOUND");
    const s = res.summary;
    const day = (d: Date | null) => (d ? formatShortDate(todayStr(d)) : null);
    return ok({
      summary: s
        ? {
            since: s.since ? formatMonthYear(todayStr(s.since)) : null,
            done: s.done,
            noShows: s.noShows,
            cancelled: s.cancelled,
            spent: formatBRL(s.spentCents),
            attendance: attendanceRate(s.done, s.noShows),
            lastVisit: day(s.lastVisit),
            next: s.next ? shortWhen(s.next) : null,
            credit: s.creditCents > 0 ? formatBRL(s.creditCents) : null,
            plans: s.plans.map((p) => ({ ...p, until: p.expiresOn ? formatShortDate(p.expiresOn) : null })),
          }
        : null,
      items: res.page.items.map((e) => toItem(e, now)),
      next: res.page.next,
    });
  } catch {
    return fail("UNKNOWN");
  }
}
