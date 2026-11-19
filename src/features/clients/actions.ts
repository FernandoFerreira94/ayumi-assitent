"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { visitHistory } from "@/features/returns/rules";
import { formatDayTitle, formatShortDate, formatTime, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { clientSummary, deleteClientRow, HISTORY, insertClient, updateClientRow } from "./core";
import { clientMoves } from "@/features/wallet/core";
import { walletBalance, walletStatement } from "@/features/wallet/rules";
import { clientInput } from "./schema";

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
    if (res.ok) revalidatePath("/clientes");
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
};

/** Dados do cartão da cliente, já em texto para a tela (o fuso é o do servidor, igual à agenda). */
export async function loadClientCard(id: string): Promise<ActionResult<ClientCard>> {
  const { tenantId } = await requireTenant();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("VALIDATION");
  try {
    const [s, moves] = await withTenant(tenantId, async (tx) => [await clientSummary(tx, id), await clientMoves(tx, id)] as const);
    const day = (d: Date) => formatDayTitle(todayStr(d));
    const { visits, averageGap } = visitHistory(
      s.history.map((v) => ({ date: todayStr(v.startsAt), service: v.service })),
      HISTORY,
    );
    return ok({
      next: s.next ? { when: `${day(s.next.startsAt)} às ${formatTime(s.next.startsAt)}`, service: s.next.service } : null,
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
        moves: walletStatement(moves).map((m) => ({ day: formatShortDate(todayStr(m.at)), label: m.label, cents: m.cents })),
      },
    });
  } catch {
    return fail("UNKNOWN");
  }
}
