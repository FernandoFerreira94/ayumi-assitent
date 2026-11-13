/**
 * Gerador mínimo de iCalendar (RFC 5545) para o link assinado do Calendário do iPhone.
 * Sem dependência: só VEVENT com horário em UTC, texto escapado e linhas dobradas em 75 octetos.
 */

export type FeedEvent = {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  /** Usado em DTSTAMP/LAST-MODIFIED; o iOS compara para saber se mudou */
  updated: Date;
};

const CRLF = "\r\n";

export function icsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function escapeText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Dobra a linha em pedaços de até 75 octetos (UTF-8), sem cortar um caractere ao meio. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // continuação começa com espaço
    if (size + n > limit) {
      parts.push(cur);
      cur = "";
      size = 0;
    }
    cur += ch;
    size += n;
  }
  parts.push(cur);
  return parts.join(CRLF + " ");
}

export type TitleInput = {
  clientName: string | null;
  service: string;
  status: string;
  hideNames: boolean;
};

/** "Ana · Corte" (ou "Atendimento · Corte" com nome oculto); avisa quando falta a cliente confirmar. */
export function eventTitle({ clientName, service, status, hideNames }: TitleInput): string {
  const first = clientName?.trim().split(/\s+/)[0];
  const who = hideNames || !first ? "Atendimento" : first;
  let suffix = "";
  if (status === "pending_confirmation") suffix = " (a confirmar)";
  else if (status === "reschedule_requested") suffix = " (pediu para remarcar)";
  return `${who} · ${service}${suffix}`;
}

export function buildIcs({
  calName,
  events,
  now = new Date(),
}: {
  calName: string;
  events: FeedEvent[];
  now?: Date;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bubbly//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${icsDate(now)}`,
      `LAST-MODIFIED:${icsDate(e.updated)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}
