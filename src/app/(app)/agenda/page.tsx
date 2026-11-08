import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { AgendaRefresh } from "@/features/appointments/AgendaRefresh";
import { dayBriefing } from "@/features/appointments/briefing";
import { dayVersion } from "@/features/appointments/version";
import { forecastCents, listDay, receivedCents } from "@/features/appointments/core";
import { DayBubble } from "@/features/appointments/DayBubble";
import { DayStrip } from "@/features/appointments/DayStrip";
import { DayTimeline } from "@/features/appointments/DayTimeline";
import { freeGaps, minuteOf, timelineWindow } from "@/features/appointments/timeline";
import { listBlocks } from "@/features/blocks/core";
import { getHours } from "@/features/hours/core";
import { weekdayOf } from "@/features/hours/slots";
import { NewBlockSheet } from "@/features/blocks/NewBlockSheet";
import { NewAppointmentSheet } from "@/features/appointments/NewAppointmentSheet";
import { bookingOptions } from "@/features/appointments/options";
import { searchClients } from "@/features/clients/core";
import { listServices } from "@/features/services/core";
import { dayRange, formatBRL, formatMonthYear, greeting, isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const { d } = await searchParams;
  const today = todayStr();
  const date = typeof d === "string" && isDateStr(d) ? d : today;
  const { tenantId, userName } = await requireTenant();

  const { rows, dayBlocks, clients, services, week } = await withTenant(tenantId, async (tx) => ({
    week: await getHours(tx),
    dayBlocks: await listBlocks(tx, dayRange(date)),
    rows: await listDay(tx, dayRange(date)),
    clients: await searchClients(tx, ""),
    services: await listServices(tx),
  }));

  const version = dayVersion(rows, dayBlocks);
  const day = week[weekdayOf(date)];
  const forecast = forecastCents(rows);
  const received = receivedCents(rows);
  const span = (s: Date, e: Date) => ({ start: minuteOf(s), end: minuteOf(e) });
  const events = [
    ...rows.map((r) => ({
      kind: "appointment" as const,
      ...span(r.startsAt, r.endsAt),
      id: r.id,
      clientName: r.clientName,
      serviceName: r.serviceName,
      price: formatBRL(r.priceCents),
      status: r.status,
    })),
    ...dayBlocks.map((b) => ({ kind: "block" as const, ...span(b.startsAt, b.endsAt), id: b.id, reason: b.reason })),
  ];

  return (
    <PageShell title={greeting(new Date(), userName)}>
      <AgendaRefresh key={version} date={date} version={version} />
      <DayBubble briefing={dayBriefing(rows, new Date(), date === today)} />
      <div className="mb-2 flex min-h-11 items-center justify-between gap-3 px-1">
        <p className="flex items-center gap-1.5 text-sm font-bold text-primary-text">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
            <path d="M8 3v3.5M16 3v3.5M3.5 10h17" />
          </svg>
          {formatMonthYear(date)}
        </p>
        {date !== today ? (
          <Link
            href="/agenda"
            scroll={false}
            className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold leading-[2.6rem]"
          >
            Hoje
          </Link>
        ) : null}
      </div>
      <div data-tour="days">
        <DayStrip date={date} today={today} />
      </div>

      <div data-tour="money" className="glass mb-4 grid gap-3 rounded-3xl px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Previsto do dia</p>
            <p className="text-2xl font-bold">{formatBRL(forecast)}</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-2 text-right text-xs font-bold tabular-nums">
            <dt className="text-muted">Recebido</dt>
            <dd className="text-ok">{formatBRL(received)}</dd>
            <dt className="text-muted">Falta</dt>
            <dd className="text-primary-text">{formatBRL(forecast - received)}</dd>
          </dl>
        </div>
        {forecast > 0 ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-soft" role="img" aria-label={`${Math.round((received / forecast) * 100)}% recebido`}>
            <div className="h-full rounded-full bg-ok" style={{ width: `${(received / forecast) * 100}%` }} />
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <NewBlockSheet date={date} />
          <NewAppointmentSheet date={date} {...bookingOptions(clients, services)} />
        </div>
      </div>

      {events.length === 0 && !day ? (
        <EmptyState title="Dia fechado" description="Fora do expediente. Ainda dá para agendar se precisar." />
      ) : (
        <DayTimeline
          date={date}
          window={timelineWindow(day, events)}
          events={events}
          free={freeGaps(day, events)}
          nowMin={date === today ? minuteOf(new Date()) : null}
        />
      )}
    </PageShell>
  );
}
