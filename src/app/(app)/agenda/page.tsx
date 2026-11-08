import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { dayBriefing } from "@/features/appointments/briefing";
import { listDay } from "@/features/appointments/core";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { DayBubble } from "@/features/appointments/DayBubble";
import { dayRange, formatDayTitle, greeting, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Painel" };

/** Painel: a Bolha e o dia de hoje, com arrastar para remarcar. Outros dias ficam em /calendario. */
export default async function PainelPage() {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const today = todayStr();
  const { tenantId, userName } = await requireTenant();
  const rows = await withTenant(tenantId, (tx) => listDay(tx, dayRange(today)));
  const label = formatDayTitle(today);

  return (
    <PageShell home title={greeting(new Date(), userName)} subtitle={label.charAt(0).toUpperCase() + label.slice(1)}>
      <DayBubble briefing={dayBriefing(rows, new Date(), true)} isToday />
      <DaySchedule tenantId={tenantId} date={today} withStrip={false} />
    </PageShell>
  );
}
