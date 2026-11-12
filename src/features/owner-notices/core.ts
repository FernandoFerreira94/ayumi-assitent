import { and, asc, desc, eq, gt, gte, inArray, lt } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks, clients, messages, ownerNotices, pushSubscriptions } from "@/db/schema";
import { getHours } from "@/features/hours/core";
import { sendToAll, type PushRun } from "@/features/push/core";
import type { PushPort } from "@/features/push/port";
import { addDays, dayRange, formatTime, greeting, todayStr, toInstant } from "@/lib/dates";
import { holidayOn, holidaysBetween } from "./holidays";
import { dueNotices, isDayOff, LATE_MIN, dayEndMin, toMin, type NoticeKind } from "./plan";
import {
  clientGreetingFallback,
  dayEndBank,
  dayEndText,
  HOLIDAY_ASK,
  morningBankSize,
  morningText,
  pickVariant,
  weekFallback,
  type DaySummary,
  type NoticeText,
  type WeekDay,
} from "./texts";
import { forecastToday, weatherEmoji, weatherLine, type Forecast } from "./weather";
import { mascotTitle } from "@/components/brand/mascots";

export type Salon = {
  name: string;
  ownerName: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type NoticeAi = {
  weekPlan(input: { name: string; days: string; lastWeek: string | null }): Promise<string | null>;
  holidayGreeting(input: { holiday: string; salon: string; last: string | null }): Promise<string | null>;
};

export type NoticeDeps = {
  ai: NoticeAi | null;
  forecast?: (salon: Salon) => Promise<Forecast | null>;
  /** Mascote de cada pessoa (Meu perfil), para o emoji do título do aviso no celular dela */
  mascots?: Record<string, string>;
};

/** Título do aviso com o emoji do mascote que a pessoa escolheu em Meu perfil (sem reinstalar o app). */
export { mascotTitle };

const isNight = (hello: string) => hello.startsWith("Boa noite");

const localMin = (d: Date) => toMin(formatTime(d));
const weekdayOf = (date: string) => new Date(`${date}T12:00:00-03:00`).getUTCDay();
const LIVE = ["pending_confirmation", "confirmed", "reschedule_requested", "done"] as const;

type DayRow = { id: string; startsAt: Date; endsAt: Date; status: string; clientName: string };

async function dayAppointments(tx: Tx, date: string): Promise<DayRow[]> {
  const [from, to] = dayRange(date);
  return tx
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      clientName: clients.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .where(
      and(gte(appointments.startsAt, from), lt(appointments.startsAt, to), inArray(appointments.status, [...LIVE])),
    )
    .orderBy(asc(appointments.startsAt));
}

/** Um bloqueio cobre todo o expediente do dia (folga avulsa, férias, evento do Google o dia inteiro). */
async function blockedAllDay(tx: Tx, date: string, hours: { opens: string; closes: string } | null): Promise<boolean> {
  if (!hours) return false;
  const open = toInstant(date, hours.opens);
  const close = toInstant(date, hours.closes);
  const rows = await tx
    .select({ startsAt: blocks.startsAt, endsAt: blocks.endsAt })
    .from(blocks)
    .where(and(lt(blocks.startsAt, close), gt(blocks.endsAt, open)));
  return rows.some((b) => b.startsAt <= open && b.endsAt >= close);
}

/** Quem pediu para cancelar (última resposta = cancel) entre os que estão aguardando remarcar/cancelar. */
async function cancelAsks(tx: Tx, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const rows = await tx
    .select({ appointmentId: messages.appointmentId, intent: messages.intent })
    .from(messages)
    .where(
      and(
        inArray(messages.appointmentId, ids),
        eq(messages.direction, "in"),
        inArray(messages.intent, ["cancel", "reschedule"]),
      ),
    )
    .orderBy(asc(messages.createdAt));
  const last = new Map<string, string>();
  for (const r of rows) if (r.appointmentId && r.intent) last.set(r.appointmentId, r.intent);
  return new Set([...last].filter(([, i]) => i === "cancel").map(([id]) => id));
}

export async function daySummary(tx: Tx, rows: DayRow[]): Promise<DaySummary | null> {
  if (!rows.length) return null;
  const asking = rows.filter((r) => r.status === "reschedule_requested").map((r) => r.id);
  const cancel = await cancelAsks(tx, asking);
  return {
    names: rows.map((r) => r.clientName),
    firstTime: formatTime(rows[0]!.startsAt),
    confirmed: rows.filter((r) => r.status === "confirmed" || r.status === "done").length,
    pending: rows.filter((r) => r.status === "pending_confirmation").length,
    reschedule: asking.length - cancel.size,
    cancel: cancel.size,
  };
}

async function recentVariants(tx: Tx, kind: NoticeKind): Promise<number[]> {
  const r = await tx
    .select({ v: ownerNotices.variant })
    .from(ownerNotices)
    .where(eq(ownerNotices.kind, kind))
    .orderBy(desc(ownerNotices.day))
    .limit(3);
  return r.map((x) => x.v);
}

async function lastDetail(tx: Tx, kind: NoticeKind, before: string): Promise<string | null> {
  const [r] = await tx
    .select({ d: ownerNotices.detail })
    .from(ownerNotices)
    .where(and(eq(ownerNotices.kind, kind), lt(ownerNotices.day, before)))
    .orderBy(desc(ownerNotices.day))
    .limit(1);
  return r?.d ?? null;
}

const shortDay = (date: string) => {
  const d = new Date(`${date}T12:00:00-03:00`);
  const wd = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" })
    .format(d)
    .replace(".", "");
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${date.slice(8, 10)}/${date.slice(5, 7)}`;
};

async function weekDays(tx: Tx, monday: string, salon: Salon): Promise<WeekDay[]> {
  const week = await getHours(tx);
  const holidays = holidaysBetween(monday, addDays(monday, 6), salon.state, salon.city);
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const hours = week[weekdayOf(date)] ?? null;
    const rows = await dayAppointments(tx, date);
    const full = rows.length === 0 && (await blockedAllDay(tx, date, hours));
    days.push({
      date,
      label: shortDay(date),
      off: isDayOff({ hours, appts: rows, fullDayBlock: full }),
      count: rows.length,
      holiday: holidays.find((h) => h.date === date)?.name ?? null,
    });
  }
  return days;
}

type Built = NoticeText & { variant: number; detail: string | null; tag: string };

/** Monta o texto de um aviso; null = nada a dizer. */
async function build(
  tx: Tx,
  kind: NoticeKind,
  now: Date,
  today: string,
  salon: Salon,
  rows: DayRow[],
  deps: NoticeDeps,
): Promise<Built | null> {
  const hello = greeting(now, salon.ownerName);
  const recent = await recentVariants(tx, kind);
  switch (kind) {
    case "morning": {
      const summary = await daySummary(tx, rows);
      const variant = pickVariant(morningBankSize(!summary), recent);
      const f = await (deps.forecast ?? defaultForecast)(salon);
      const sky = f ? weatherEmoji(f.code, isNight(hello)) : undefined;
      return { ...withWeather(morningText(variant, hello, summary, sky), f), variant, detail: null, tag: kind };
    }
    case "day_end": {
      const week = await getHours(tx);
      const h = week[weekdayOf(today)];
      const live = rows.filter((r) => r.status !== "reschedule_requested");
      const end = dayEndMin({
        hours: h ? { opens: toMin(h.opens), closes: toMin(h.closes) } : null,
        appts: live.map((r) => ({ start: localMin(r.startsAt), end: localMin(r.endsAt) })),
      });
      const late = (end ?? 0) >= LATE_MIN;
      const asking = rows.filter((r) => r.status === "reschedule_requested");
      const [from, to] = dayRange(today);
      const gone = await tx
        .select({ status: appointments.status })
        .from(appointments)
        .where(
          and(
            gte(appointments.startsAt, from),
            lt(appointments.startsAt, to),
            inArray(appointments.status, ["no_show", "cancelled"]),
          ),
        );
      const tomorrow = addDays(today, 1);
      const th = week[weekdayOf(tomorrow)] ?? null;
      const next = (await dayAppointments(tx, tomorrow)).filter((r) => r.status !== "reschedule_requested");
      const off = isDayOff({
        hours: th,
        appts: next,
        fullDayBlock: next.length === 0 && (await blockedAllDay(tx, tomorrow, th)),
      });
      const variant = pickVariant(dayEndBank(late).length, recent);
      const t = dayEndText(
        variant,
        {
          served: live.filter((r) => r.endsAt <= now).length,
          noShow: gone.filter((r) => r.status === "no_show").length,
          cancelled: gone.filter((r) => r.status === "cancelled").length,
          reschedule: asking.length,
        },
        off ? { off: true } : { off: false, count: next.length, firstTime: next[0] ? formatTime(next[0].startsAt) : null },
        late,
      );
      return { ...t, variant, detail: null, tag: kind };
    }
    case "week": {
      const monday = addDays(today, 1);
      const days = await weekDays(tx, monday, salon);
      const lines = days
        .map(
          (d) =>
            `${d.label}: ${d.off ? "folga" : `${d.count} cliente(s)`}${d.holiday ? ` · feriado/data: ${d.holiday}` : ""}`,
        )
        .join("\n");
      const last = await lastDetail(tx, "week", monday);
      const text =
        (await deps.ai?.weekPlan({ name: salon.ownerName ?? salon.name, days: lines, lastWeek: last })) ??
        weekFallback(days);
      const total = days.reduce((s, d) => s + d.count, 0);
      const hol = days.filter((d) => d.holiday).map((d) => d.holiday);
      const body = [
        total
          ? `${total === 1 ? "1 cliente marcada" : `${total} clientes marcadas`} para a semana.`
          : "Semana com a agenda aberta.",
        hol.length ? `Atenção: ${hol.join(", ")}.` : "",
        "Toque para ver o roteiro.",
      ]
        .filter(Boolean)
        .join(" ");
      return { title: "Seu roteiro da semana 🗓️", body, variant: 0, detail: text, tag: kind };
    }
    case "holiday": {
      const tomorrow = addDays(today, 1);
      const h = holidayOn(tomorrow, salon.state, salon.city);
      if (!h?.greet) return null;
      const last = await lastDetail(tx, "holiday", tomorrow);
      const msg =
        (await deps.ai?.holidayGreeting({ holiday: h.name, salon: salon.name, last })) ??
        clientGreetingFallback(h.name, salon.name);
      const variant = pickVariant(HOLIDAY_ASK.length, recent);
      return { title: `Amanhã é ${h.name} 💜`, body: HOLIDAY_ASK[variant]!, variant, detail: msg, tag: kind };
    }
  }
}

async function defaultForecast(salon: Salon) {
  if (salon.latitude == null || salon.longitude == null) return null;
  return forecastToday({ latitude: salon.latitude, longitude: salon.longitude });
}

/** A previsão do dia vai no fim do aviso da manhã e da folga (quando o salão tem cidade). */
const withWeather = (t: NoticeText, f: Forecast | null): NoticeText =>
  f ? { ...t, body: `${t.body}\n${weatherLine(f)}` } : t;

/** Link aberto ao tocar: avisos com texto longo abrem o diálogo por cima da Agenda. */
export const noticeUrl = (id: string, withDetail: boolean) => (withDetail ? `/agenda?aviso=${id}` : "/agenda");

/** O que está na hora para este estúdio agora (a transação já está no estúdio). */
export async function runTenantNotices(
  tx: Tx,
  tenantId: string,
  push: PushPort,
  now: Date,
  salon: Salon,
  deps: NoticeDeps,
): Promise<PushRun & { kinds: NoticeKind[] }> {
  const run = { sent: 0, removed: 0, failed: 0, kinds: [] as NoticeKind[] };
  const [sub] = await tx.select({ id: pushSubscriptions.id }).from(pushSubscriptions).limit(1);
  if (!sub) return run; // ninguém com aviso ligado

  const today = todayStr(now);
  const week = await getHours(tx);
  const h = week[weekdayOf(today)] ?? null;
  const rows = await dayAppointments(tx, today);
  const live = rows.filter((r) => r.status !== "reschedule_requested");
  const tomorrowHoliday = holidayOn(addDays(today, 1), salon.state, salon.city);
  const due = dueNotices({
    nowMin: localMin(now),
    weekday: weekdayOf(today),
    hours: h ? { opens: toMin(h.opens), closes: toMin(h.closes) } : null,
    appts: live.map((r) => ({ start: localMin(r.startsAt), end: localMin(r.endsAt) })),
    fullDayBlock: rows.length === 0 && (await blockedAllDay(tx, today, h)),
    greetTomorrow: !!tomorrowHoliday?.greet,
  });

  for (const { kind, tomorrow } of due) {
    const day = tomorrow ? addDays(today, 1) : today;
    const [exists] = await tx
      .select({ id: ownerNotices.id })
      .from(ownerNotices)
      .where(and(eq(ownerNotices.kind, kind), eq(ownerNotices.day, day)))
      .limit(1);
    if (exists) continue;
    const text = await build(tx, kind, now, today, salon, rows, deps);
    if (!text) continue;
    const [row] = await tx
      .insert(ownerNotices)
      .values({
        tenantId,
        kind,
        day,
        variant: text.variant,
        title: text.title,
        body: text.body,
        detail: text.detail,
      })
      .onConflictDoNothing()
      .returning({ id: ownerNotices.id });
    if (!row) continue;
    const r = await sendToAll(tx, push, (sub) => ({
      title: mascotTitle(text.title, deps.mascots?.[sub.userId]),
      body: text.body,
      url: noticeUrl(row.id, !!text.detail),
      tag: text.tag,
    }));
    // Nenhum aparelho recebeu: apaga para tentar de novo na próxima rodada
    if (r.sent === 0 && r.failed > 0) await tx.delete(ownerNotices).where(eq(ownerNotices.id, row.id));
    run.sent += r.sent;
    run.removed += r.removed;
    run.failed += r.failed;
    run.kinds.push(kind);
  }
  return run;
}

/**
 * Aviso de teste (botão em Ajustes): o mesmo resumo de hoje que sairia de manhã, com os dados reais (dia sem
 * clientes mostra a agenda livre). Não fica registrado.
 */
export async function testNotice(tx: Tx, now: Date, salon: Salon, deps: Pick<NoticeDeps, "forecast"> = {}) {
  const today = todayStr(now);
  const rows = await dayAppointments(tx, today);
  const hello = greeting(now, salon.ownerName);
  const f = await (deps.forecast ?? defaultForecast)(salon);
  const rand = (n: number) => Math.floor(Math.random() * n);
  const summary = await daySummary(tx, rows);
  const sky = f ? weatherEmoji(f.code, isNight(hello)) : undefined;
  return withWeather(morningText(rand(morningBankSize(!summary)), hello, summary, sky), f);
}

export async function loadNotice(tx: Tx, id: string) {
  const [r] = await tx
    .select({
      kind: ownerNotices.kind,
      title: ownerNotices.title,
      body: ownerNotices.body,
      detail: ownerNotices.detail,
    })
    .from(ownerNotices)
    .where(eq(ownerNotices.id, id))
    .limit(1);
  return r ?? null;
}
