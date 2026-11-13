import { and, asc, gte, inArray, isNull, lt } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { blocks } from "@/db/schema";
import { listDay } from "@/features/appointments/core";
import { dayRange, todayStr } from "@/lib/dates";

/** Até quantas pílulas o mês mostra por dia; o resto vira "+N". */
export const MAX_PILLS = 3;
/** Título de evento de fora cortado no servidor: a célula só mostra umas 8 letras e o ano inteiro vai para o celular. */
const EXT_TITLE_MAX = 24;

/** "ok" = cliente confirmou; "wait" = ainda pendente (ou pediu para remarcar). */
export type PillState = "ok" | "wait";
/** Evento de fora do app (Google Agenda ou Calendário do iPhone): pílula cinza com o ícone da origem. */
export type ExtSource = "google" | "icloud";
export type DayPill = { name: string; color?: string; st?: PillState; ext?: ExtSource };
/**
 * Resumo do ano por dia: `n` atendimentos, `x` eventos de fora (Google/iPhone) e as primeiras pílulas,
 * em ordem de horário (atendimento = primeiro nome + cor do serviço; evento de fora = título, cinza).
 */
export type YearDays = Record<string, { n: number; x?: number; pills: DayPill[] }>;

const first = (n: string) => n.trim().split(/\s+/)[0];
const pillState = (s: string): PillState | undefined =>
  s === "confirmed" ? "ok" : s === "pending_confirmation" || s === "reschedule_requested" ? "wait" : undefined;

type ApptRow = { startsAt: Date; clientName: string; serviceColor: string; status: string };
type ExtRow = { startsAt: Date; reason: string | null; source: string };

const extLabel = (s: ExtSource) => (s === "google" ? "Evento do Google" : "Evento do iPhone");

/** Junta atendimentos e eventos de fora por dia (fuso do estúdio), na ordem do horário. Puro, para teste. */
export function buildYearDays(appts: ApptRow[], events: ExtRow[]): YearDays {
  type Item = { t: number; pill: DayPill; ext: boolean };
  const items: Item[] = [];
  for (const r of appts)
    items.push({ t: r.startsAt.getTime(), ext: false, pill: { name: first(r.clientName), color: r.serviceColor, st: pillState(r.status) } });
  for (const e of events) {
    if (e.source !== "google" && e.source !== "icloud") continue;
    const name = (e.reason ?? "").trim().slice(0, EXT_TITLE_MAX) || extLabel(e.source);
    items.push({ t: e.startsAt.getTime(), ext: true, pill: { name, ext: e.source } });
  }
  items.sort((a, b) => a.t - b.t);
  const days: YearDays = {};
  for (const it of items) {
    const d = todayStr(new Date(it.t));
    const cur = (days[d] ??= { n: 0, pills: [] });
    if (it.ext) cur.x = (cur.x ?? 0) + 1;
    else cur.n++;
    if (cur.pills.length < MAX_PILLS) cur.pills.push(it.pill);
  }
  return days;
}

/** Um ano inteiro em duas consultas, já enxuto para o celular trocar de mês e ano sem voltar ao servidor. */
export async function loadYearDays(tx: Tx, year: string): Promise<YearDays> {
  const range: [Date, Date] = [dayRange(`${year}-01-01`)[0], dayRange(`${year}-12-31`)[1]];
  const appts = await listDay(tx, range);
  const events = await tx
    .select({ startsAt: blocks.startsAt, reason: blocks.reason, source: blocks.source })
    .from(blocks)
    .where(
      and(
        inArray(blocks.source, ["google", "icloud"]),
        gte(blocks.startsAt, range[0]),
        lt(blocks.startsAt, range[1]),
        isNull(blocks.convertedAt),
      ),
    )
    .orderBy(asc(blocks.startsAt));
  return buildYearDays(appts, events);
}
