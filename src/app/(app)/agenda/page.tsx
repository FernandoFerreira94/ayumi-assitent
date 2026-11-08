import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { AgendaDay } from "@/features/appointments/AgendaDay";
import { daySpan, gridWindow, serviceTone, weekOf } from "@/features/appointments/agenda-grid";
import { AgendaRefresh } from "@/features/appointments/AgendaRefresh";
import { dayBriefing } from "@/features/appointments/briefing";
import { dayVersion } from "@/features/appointments/version";
import { forecastCents, listDay } from "@/features/appointments/core";
import { DayBubble } from "@/features/appointments/DayBubble";
import { minuteOf } from "@/features/appointments/timeline";
import { WeekStrip } from "@/features/appointments/WeekStrip";
import { listBlocks } from "@/features/blocks/core";
import { getHours } from "@/features/hours/core";
import { weekdayOf } from "@/features/hours/slots";
import { NewBlockSheet } from "@/features/blocks/NewBlockSheet";
import { bookingOptions } from "@/features/appointments/options";
import { searchClients } from "@/features/clients/core";
import { listBookable } from "@/features/services/core";
import { dayRange, formatBRL, formatDayTitle, greeting, isDateStr, todayStr } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await connection(); // "hoje" depende do relÃ³gio: renderiza a cada pedido
  const { d } = await searchParams;
  const today = todayStr();
  const date = typeof d === "string" && isDateStr(d) ? d : today;
  const { tenantId, userName } = await requireTenant();
  const week = weekOf(date);
  // Uma consulta para a semana toda: os pontinhos da faixa saem dela e o dia Ã© filtrado daqui
  const weekRange: [Date, Date] = [dayRange(week[0])[0], dayRange(week[6])[1]];

  const { weekRows, dayBlocks, clients, services, openHours } = await withTenant(tenantId, async (tx) => ({
    openHours: await getHours(tx),
    dayBlocks: await listBlocks(tx, dayRange(date)),
    weekRows: await listDay(tx, weekRange),
    clients: await searchClients(tx, ""),
    services: await listBookable(tx),
  }));

  const rows = weekRows.filter((r) => todayStr(r.startsAt) === date);
  const version = dayVersion(rows, dayBlocks);
  const hours = daySpan(openHours[weekdayOf(date)]);
  const span = (s: Date, e: Date) => ({ start: minuteOf(s), end: minuteOf(e) });
  const appointments = rows.map((r) => ({
    kind: "appointment" as const,
    ...span(r.startsAt, r.endsAt),
    id: r.id,
    clientId: r.clientId,
    clientName: r.clientName,
    clientPhone: maskPhone(r.clientPhone.replace(/^\+55/, "")),
    serviceName: r.serviceName,
    price: formatBRL(r.priceCents),
    status: r.status,
    tone: serviceTone(r.serviceId),
  }));
  const blocks = dayBlocks.map((b) => ({ kind: "block" as const, ...span(b.startsAt, b.endsAt), id: b.id, reason: b.reason }));
  const busyDays = new Set(weekRows.map((r) => todayStr(r.startsAt)));
  const n = rows.length;
  const summary =
    n === 0
      ? hours
        ? "Nenhum atendimento ainda"
        : "SalÃ£o fechado"
      : `${n} atendimento${n === 1 ? "" : "s"} Â· previsto ${formatBRL(forecastCents(rows))}`;
  const dayLabel = formatDayTitle(date);

  return (
    <PageShell home title={greeting(new Date(), userName)} subtitle={dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}>
      <AgendaRefresh key={version} date={date} version={version} />
      <DayBubble briefing={dayBriefing(rows, new Date(), date === today)} isToday={date === today} />
      <div data-tour="days">
        <WeekStrip
          date={date}
          today={today}
          summary={summary}
          days={week.map((w) => ({ date: w, has: busyDays.has(w), closed: !openHours[weekdayOf(w)] }))}
        />
      </div>
      <AgendaDay
        key={date}
        date={date}
        win={gridWindow([...appointments, ...blocks])}
        hours={hours}
        appointments={appointments}
        blocks={blocks}
        nowMin={date === today ? minuteOf(new Date()) : null}
        {...bookingOptions(clients, services)}
        blockButton={<NewBlockSheet date={date} />}
      />
    </PageShell>
  );
}
