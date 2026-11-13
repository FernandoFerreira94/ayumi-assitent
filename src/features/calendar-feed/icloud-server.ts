import "server-only";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { isIcloudUrl, parseIcsEvents } from "./icloud";
import { importIcloudEvents } from "./icloud-import";

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

/** Lê o calendário e grava na agenda. Lança em falha (nada é apagado sem a lista completa). */
export async function syncIcloud(tenantId: string, url: string, fetchImpl: typeof fetch = fetch): Promise<number> {
  const text = await fetchIcloudIcs(url, fetchImpl);
  const [from, to] = icloudWindow();
  let events;
  try {
    events = parseIcsEvents(text, from, to);
  } catch {
    throw new IcloudFetchError("not_calendar");
  }
  return withTenant(tenantId, (tx) => importIcloudEvents(tx, tenantId, events, from, to));
}

/**
 * Traz os eventos do Calendário do iPhone para a agenda (somente leitura), junto com o Google ao abrir o dia.
 * Nunca lança: sem link ou com falha, a agenda segue com o que já tem.
 */
export async function importIcloudCalendar(tenantId: string, force = false): Promise<void> {
  const last = lastImport.get(tenantId) ?? 0;
  if (!force && Date.now() - last < MIN_INTERVAL_MS) return;
  lastImport.set(tenantId, Date.now());
  try {
    // tenants não tem FORCE RLS: leitura do próprio estúdio pelo dono do banco, como em isGoogleConnected
    const [t] = await getDb()
      .select({ url: tenants.icloudCalendarUrl })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (!t?.url) return;
    await syncIcloud(tenantId, t.url);
  } catch (e) {
    lastImport.delete(tenantId);
    console.error("icloud_import_failed", { error: e instanceof IcloudFetchError ? e.kind : "unknown" });
  }
}

/** Depois de salvar um link novo, a próxima tela importa na hora. */
export const resetIcloudThrottle = (tenantId: string) => lastImport.delete(tenantId);
