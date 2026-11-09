import { connection } from "next/server";
import { Suspense } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { CalendarShell } from "@/features/calendar/CalendarShell";
import { loadYearDays } from "@/features/calendar/data";
import { getHours } from "@/features/hours/core";
import { todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { CalendarSkeleton } from "./CalendarSkeleton";

/**
 * O Calendário é um componente só: a casca (ano e mês, gestos e zoom) fica montada aqui no layout,
 * que não recarrega ao trocar a URL. Só a visão de dia vem do servidor, pela página.
 */
export default function CalendarioLayout({ children }: LayoutProps<"/calendario">) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarData>{children}</CalendarData>
    </Suspense>
  );
}

async function CalendarData({ children }: { children: React.ReactNode }) {
  await connection(); // "hoje" depende do relógio
  const today = todayStr();
  const year = today.slice(0, 4);
  const { tenantId } = await requireTenant();
  const { days, hours } = await withTenant(tenantId, async (tx) => ({
    days: await loadYearDays(tx, year),
    hours: await getHours(tx),
  }));
  return (
    <PageShell title="Calendário">
      <CalendarShell today={today} year={year} days={days} closedWeekdays={hours.flatMap((h, i) => (h ? [] : [i]))}>
        {children}
      </CalendarShell>
    </PageShell>
  );
}
