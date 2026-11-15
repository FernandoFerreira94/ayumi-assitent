import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { dayBriefing } from "@/features/appointments/briefing";
import { forecastCents, listDay, receivedCents } from "@/features/appointments/core";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { DayCards } from "@/features/appointments/DayCards";
import { DayHero } from "@/features/appointments/DayHero";
import { dayForecast, dayPendencias, upcoming } from "@/features/appointments/day-panel";
import { dayRange, formatDayTitle, formatTime, greeting, isDateStr, todayStr } from "@/lib/dates";
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
  const now = new Date();

  return (
    <PageShell wide title={greeting(new Date(), userName)} subtitle={label.charAt(0).toUpperCase() + label.slice(1)}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* No celular a Bolha vem antes da agenda; na tela larga ela vai para a coluna da direita */}
        <aside aria-label="Contexto do dia" className="lg:sticky lg:top-7 lg:order-2">
          <DayHero
            briefing={dayBriefing(rows, now, date === today)}
            isToday={date === today}
            receivedCents={receivedCents(rows)}
            forecastCents={forecastCents(rows)}
          />
          <DayCards
            isToday={date === today}
            forecast={dayForecast(rows)}
            pendencias={dayPendencias(rows, now)}
            next={upcoming(rows, now).map((r) => ({
              id: r.id,
              time: formatTime(r.startsAt),
              clientName: r.clientName,
              serviceName: r.serviceName,
            }))}
          />
        </aside>
        <div className="min-w-0 lg:order-1">
          <DaySchedule tenantId={tenantId} date={date} withStrip base="/agenda" actions={false} />
        </div>
      </div>
    </PageShell>
  );
}
