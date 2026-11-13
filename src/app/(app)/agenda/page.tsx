import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { dayBriefing } from "@/features/appointments/briefing";
import { forecastCents, listDay, receivedCents } from "@/features/appointments/core";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { DayHero } from "@/features/appointments/DayHero";
import { dayRange, formatDayTitle, greeting, isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Painel" };

/** Painel: a Bolha com os ganhos do dia, a faixa da semana e o horário do dia, com arrastar para remarcar. Mês e ano ficam em /calendario. */
export default async function PainelPage({ searchParams }: PageProps<"/agenda">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const { d } = await searchParams;
  const today = todayStr();
  const date = typeof d === "string" && isDateStr(d) ? d : today;
  const { tenantId, userName } = await requireTenant();
  const rows = await withTenant(tenantId, (tx) => listDay(tx, dayRange(date)));
  const label = formatDayTitle(date);

  return (
    <PageShell title={greeting(new Date(), userName)} subtitle={label.charAt(0).toUpperCase() + label.slice(1)}>
      <DayHero
        briefing={dayBriefing(rows, new Date(), date === today)}
        isToday={date === today}
        receivedCents={receivedCents(rows)}
        forecastCents={forecastCents(rows)}
      />
      <DaySchedule tenantId={tenantId} date={date} withStrip base="/agenda" actions={false} />
    </PageShell>
  );
}
