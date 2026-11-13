import ICAL from "ical.js";

/**
 * Calendário do iPhone para dentro do app: lê o ICS de um calendário público do iCloud (só leitura).
 * Arquivo puro (sem banco nem rede): validar o link e transformar o ICS em eventos com horário.
 */

export type IcloudEvent = { uid: string; title: string; startsAt: Date; endsAt: Date };

/** Fuso do estúdio quando o evento vem sem fuso (hora "flutuante"): UTC-3 fixo, igual a lib/dates. */
const STUDIO_OFFSET_MS = 3 * 3_600_000;
/** Teto de eventos por leitura (repetições inclusas): protege o banco de um calendário gigante. */
export const MAX_EVENTS = 3000;
/** Teto de repetições abertas por evento (um "todo dia desde 2015" não trava a leitura). */
const MAX_STEPS = 20_000;

/**
 * Aceita o link de "Compartilhar Link" do Calendário Público (webcal:// ou https://) e devolve o https.
 * Só iCloud (`*.icloud.com`, caminho `/published/`): o servidor nunca busca um endereço qualquer (SSRF).
 */
export function normalizeIcloudUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s || s.length > 1000) return null;
  let u: URL;
  try {
    u = new URL(s.replace(/^webcals?:\/\//i, "https://"));
  } catch {
    return null;
  }
  if (!isIcloudUrl(u)) return null;
  u.hash = "";
  return u.toString();
}

export function isIcloudUrl(u: URL): boolean {
  return (
    u.protocol === "https:" &&
    !u.username &&
    !u.password &&
    (u.port === "" || u.port === "443") &&
    /^([a-z0-9-]+\.)*icloud\.com$/i.test(u.hostname) &&
    u.pathname.startsWith("/published/")
  );
}

function toDate(t: ICAL.Time): Date {
  // Sem fuso conhecido (flutuante ou TZID sem VTIMEZONE): vale o horário do estúdio
  const zone = t.zone;
  if (!zone || zone === ICAL.Timezone.localTimezone) {
    return new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second) + STUDIO_OFFSET_MS);
  }
  return t.toJSDate();
}

function skip(ev: ICAL.Event): boolean {
  const c = ev.component;
  const status = String(c.getFirstPropertyValue("status") ?? "").toUpperCase();
  const transp = String(c.getFirstPropertyValue("transp") ?? "").toUpperCase();
  return status === "CANCELLED" || transp === "TRANSPARENT" || !ev.startDate || ev.startDate.isDate;
}

/**
 * Eventos com horário que cruzam a janela [from, to), já com as repetições abertas.
 * Ficam fora: dia inteiro (aniversário, feriado), cancelados, "livre" (TRANSPARENT) e o nosso próprio link (@bubbly).
 * Lança se o texto não for um calendário: quem chama não apaga nada nesse caso.
 */
export function parseIcsEvents(text: string, from: Date, to: Date): IcloudEvent[] {
  const root = new ICAL.Component(ICAL.parse(text));
  if (root.name !== "vcalendar") throw new Error("não é um calendário");
  for (const tz of root.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(tz);

  const vevents = root.getAllSubcomponents("vevent");
  // Exceções de repetição (RECURRENCE-ID) se ligam ao evento principal
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];
  for (const c of vevents) {
    const ev = new ICAL.Event(c);
    if (!ev.uid) continue;
    if (c.hasProperty("recurrence-id")) exceptions.push(ev);
    else masters.set(ev.uid, ev);
  }
  for (const ex of exceptions) {
    const m = masters.get(ex.uid);
    if (m) m.relateException(ex);
    else masters.set(`${ex.uid}#${ex.recurrenceId}`, ex); // exceção solta: vale como evento único
  }

  const out: IcloudEvent[] = [];
  const push = (uid: string, title: string, s: Date, e: Date) => {
    if (!(e > s) || !(s < to) || !(e > from)) return;
    if (out.length >= MAX_EVENTS) throw new Error("calendário grande demais");
    out.push({ uid, title, startsAt: s, endsAt: e });
  };

  for (const ev of masters.values()) {
    if (/@bubbly$/i.test(ev.uid)) continue; // o link assinado do próprio app: já são atendimentos
    if (skip(ev)) continue;
    const title = (ev.summary ?? "").trim().slice(0, 200) || "Evento do iPhone";
    if (!ev.isRecurring()) {
      push(ev.uid, title, toDate(ev.startDate), toDate(ev.endDate));
      continue;
    }
    const it = ev.iterator();
    for (let n = 0, next = it.next(); next && n < MAX_STEPS; n++, next = it.next()) {
      if (toDate(next) >= to) break;
      const d = ev.getOccurrenceDetails(next);
      if (d.item !== ev && skip(d.item)) continue; // a exceção cancelou esta ocorrência
      const occTitle = (d.item.summary ?? "").trim().slice(0, 200) || title;
      push(`${ev.uid}#${d.recurrenceId.toUnixTime()}`, occTitle, toDate(d.startDate), toDate(d.endDate));
    }
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
