import "server-only";
import { asc, eq } from "drizzle-orm";
import { withTenant, type Tx } from "@/db/client";
import { icloudCalendars } from "@/db/schema";
import { icsCalendarName, isIcloudUrl, parseIcsEvents } from "./icloud";
import { clearOrphanIcloudEvents, importIcloudEvents } from "./icloud-import";
import type { IcloudCalendarView } from "./icloud-view";

const DAY = 86_400_000;
/** Mesma janela do Google: um pouco do passado e ~6 meses à frente. */
export const ICLOUD_WINDOW = { pastDays: 14, futureDays: 180 } as const;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
/** Não bate no iCloud a cada tela: no máximo uma vez por intervalo, por estúdio. */
const MIN_INTERVAL_MS = 2 * 60_000;
const lastImport = new Map<string, number>();

export class IcloudFetchError extends Error {
  constructor(public readonly kind: "not_found" | "failed" | "too_big" | "not_calendar") {
    super(kind);
  }
}

/**
 * Baixa o ICS do calendário público. Redirecionamento seguido à mão, revalidando que continua no iCloud
 * (o iCloud troca o servidor pXX), com tempo e tamanho limitados. Nunca loga o link.
 */
export async function fetchIcloudIcs(url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  let current = new URL(url);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isIcloudUrl(current)) throw new IcloudFetchError("failed");
    let res: Response;
    try {
      res = await fetchImpl(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: "text/calendar" },
        cache: "no-store",
      });
    } catch {
      throw new IcloudFetchError("failed");
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new IcloudFetchError("failed");
      current = new URL(loc.replace(/^webcals?:\/\//i, "https://"), current);
      continue;
    }
    if (res.status === 404 || res.status === 403 || res.status === 410) throw new IcloudFetchError("not_found");
    if (!res.ok || !res.body) throw new IcloudFetchError("failed");
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) throw new IcloudFetchError("too_big");
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new IcloudFetchError("too_big");
      }
      chunks.push(value);
    }
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    if (!/BEGIN:VCALENDAR/i.test(text.slice(0, 2000))) throw new IcloudFetchError("not_calendar");
    return text;
  }
  throw new IcloudFetchError("failed");
}

export function icloudWindow(now = Date.now()): [Date, Date] {
  return [new Date(now - ICLOUD_WINDOW.pastDays * DAY), new Date(now + ICLOUD_WINDOW.futureDays * DAY)];
}

/** Lê um calendário (rede + ICS), sem tocar no banco. Lança IcloudFetchError. */
export async function readIcloud(url: string, fetchImpl: typeof fetch = fetch) {
  const text = await fetchIcloudIcs(url, fetchImpl);
  const [from, to] = icloudWindow();
  try {
    return { name: icsCalendarName(text), events: parseIcsEvents(text, from, to), from, to };
  } catch {
    throw new IcloudFetchError("not_calendar");
  }
}

export type IcloudRead = Awaited<ReturnType<typeof readIcloud>>;

/** Grava o que foi lido de um calendário e o resultado da leitura (linha de status em Ajustes). */
export async function storeIcloudRead(tx: Tx, tenantId: string, calendarId: string, read: IcloudRead) {
  const count = await importIcloudEvents(tx, tenantId, calendarId, read.events, read.from, read.to);
  await tx
    .update(icloudCalendars)
    .set({
      eventCount: count,
      syncedAt: new Date(),
      syncError: null,
      ...(read.name ? { name: read.name } : {}),
    })
    .where(eq(icloudCalendars.id, calendarId));
  return count;
}

/**
 * Traz os eventos de todos os calendários do iPhone ligados (somente leitura), junto com o Google ao abrir o dia.
 * Um calendário com erro não segura os outros e guarda o tipo do erro para a tela. Nunca lança.
 */
export async function importIcloudCalendar(tenantId: string, force = false): Promise<void> {
  const last = lastImport.get(tenantId) ?? 0;
  if (!force && Date.now() - last < MIN_INTERVAL_MS) return;
  lastImport.set(tenantId, Date.now());
  try {
    const rows = await withTenant(tenantId, (tx) =>
      tx.select({ id: icloudCalendars.id, url: icloudCalendars.url }).from(icloudCalendars),
    );
    if (!rows.length) return;
    let allOk = true;
    for (const row of rows) {
      try {
        const read = await readIcloud(row.url);
        await withTenant(tenantId, (tx) => storeIcloudRead(tx, tenantId, row.id, read));
      } catch (e) {
        allOk = false;
        const kind = e instanceof IcloudFetchError ? e.kind : "failed";
        console.error("icloud_import_failed", { error: e instanceof IcloudFetchError ? e.kind : "unknown" });
        await withTenant(tenantId, (tx) =>
          tx.update(icloudCalendars).set({ syncError: kind }).where(eq(icloudCalendars.id, row.id)),
        ).catch(() => undefined);
      }
    }
    if (allOk) await withTenant(tenantId, (tx) => clearOrphanIcloudEvents(tx));
    else lastImport.delete(tenantId);
  } catch (e) {
    lastImport.delete(tenantId);
    console.error("icloud_import_failed", { error: e instanceof IcloudFetchError ? e.kind : "unknown" });
  }
}

/** Depois de salvar um link novo, a próxima tela importa na hora. */
export const resetIcloudThrottle = (tenantId: string) => lastImport.delete(tenantId);

/** Calendários do iCloud ligados, para a tela (sem o link). Mais antigo primeiro. */
export async function listIcloudCalendars(tenantId: string): Promise<IcloudCalendarView[]> {
  const rows = await withTenant(tenantId, (tx) =>
    tx
      .select({
        id: icloudCalendars.id,
        name: icloudCalendars.name,
        eventCount: icloudCalendars.eventCount,
        syncedAt: icloudCalendars.syncedAt,
        syncError: icloudCalendars.syncError,
      })
      .from(icloudCalendars)
      .orderBy(asc(icloudCalendars.createdAt)),
  );
  return rows.map((r) => ({ ...r, syncedAt: r.syncedAt?.toISOString() ?? null }));
}
