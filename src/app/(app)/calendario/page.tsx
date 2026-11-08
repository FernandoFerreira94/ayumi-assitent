import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/ui/PageShell";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { formatDayTitle, isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Calendário" };

export default async function CalendarioPage({ searchParams }: PageProps<"/calendario">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const { d } = await searchParams;
  const date = typeof d === "string" && isDateStr(d) ? d : todayStr();
  const { tenantId } = await requireTenant();
  const label = formatDayTitle(date);
  return (
    <PageShell title="Calendário" subtitle={label.charAt(0).toUpperCase() + label.slice(1)}>
      <DaySchedule tenantId={tenantId} date={date} withStrip />
    </PageShell>
  );
}
