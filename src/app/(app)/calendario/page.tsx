import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listDay } from "@/features/appointments/core";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { TodayFab } from "@/features/calendar/CalendarBar";
import { lastDayOf, parseView } from "@/features/calendar/grid";
import { MonthView } from "@/features/calendar/MonthView";
import { YearView } from "@/features/calendar/YearView";
import { getHours } from "@/features/hours/core";
import { dayRange, isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Calendário" };

/** Calendário como o do iPhone: ano, mês (pílulas por dia) e dia (faixa da semana e linha das horas). */
export default async function CalendarioPage({ searchParams }: PageProps<"/calendario">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const today = todayStr();
  const view = parseView({ v: str("v"), y: str("y"), m: str("m"), d: str("d") }, today, isDateStr);
  const { tenantId } = await requireTenant();

  if (view.kind === "day") {
    return (
      <PageShell title="Calendário">
        <DaySchedule tenantId={tenantId} date={view.date} withStrip calendar />
        {view.date === today ? null : <TodayFab href={`/calendario?d=${today}`} />}
      </PageShell>
    );
  }

  const [from, to] =
    view.kind === "year" ? [`${view.year}-01-01`, `${view.year}-12-31`] : [`${view.month}-01`, lastDayOf(view.month)];
  const { rows, hours } = await withTenant(tenantId, async (tx) => ({
    rows: await listDay(tx, [dayRange(from)[0], dayRange(to)[1]]),
    hours: await getHours(tx),
  }));
  const appts = rows.map((r) => ({
    date: todayStr(r.startsAt),
    clientName: r.clientName,
    serviceId: r.serviceId,
  }));

  return (
    <PageShell title="Calendário" subtitle={view.kind === "year" ? "Ano" : "Mês"}>
      {view.kind === "year" ? (
        <YearView year={view.year} busyDays={new Set(appts.map((a) => a.date))} />
      ) : (
        <MonthView
          month={view.month}
          appts={appts}
          closedWeekdays={hours.flatMap((h, i) => (h ? [] : [i]))}
          from={str("from") === "year" ? "year" : undefined}
        />
      )}
    </PageShell>
  );
}
