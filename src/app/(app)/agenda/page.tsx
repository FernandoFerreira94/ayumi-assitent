import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection, userAgent } from "next/server";
import { Suspense } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { dayBriefing } from "@/features/appointments/briefing";
import { forecastCents, listDay, receivedCents } from "@/features/appointments/core";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { DayHero } from "@/features/appointments/DayHero";
import { AgendaTabs } from "@/features/dashboard/AgendaTabs";
import { BoxSkeleton, DeskKpis, DeskNext, DeskSide, DeskWeek } from "@/features/dashboard/Desk";
import { PlatformNotices } from "@/features/support/ui/PlatformNotices";
import { dayRange, formatDayTitle, greeting, isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { loadAgendaScope } from "@/features/team/agenda-scope-server";
import { ProfessionalFilter } from "@/features/team/ProfessionalFilter";

export const metadata: Metadata = { title: "Painel" };

/**
 * Painel. No celular: a Bolha com os ganhos do dia, a faixa da semana e o horário do dia (arrastar para
 * remarcar). No tablet/desktop vira um painel do sistema todo: números da semana e do mês, próxima cliente,
 * agenda em Dia/Semana, mini mês, pendências, retornos, vagas e atalhos. Mês e ano completos ficam em /calendario.
 */
export default async function PainelPage({ searchParams }: PageProps<"/agenda">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const { d } = await searchParams;
  const today = todayStr();
  const date = typeof d === "string" && isDateStr(d) ? d : today;
  const me = await requireTenant();
  const { tenantId, userId, userName } = me;
  // Com 2+ profissionais: filtro "Todas / por profissional"; profissional vê só a própria agenda
  const scope = await loadAgendaScope(me);
  const rows = await withTenant(tenantId, (tx) => listDay(tx, dayRange(date), scope.filterId));
  const label = formatDayTitle(date);
  // Celular não carrega as caixas do desktop (nem consulta o banco para elas)
  const desk = userAgent({ headers: await headers() }).device.type !== "mobile";
  const p = { tenantId, date };

  return (
    <PageShell wide title={greeting(new Date(), userName)} subtitle={label.charAt(0).toUpperCase() + label.slice(1)}>
      {date === today ? <PlatformNotices tenantId={tenantId} userId={userId} /> : null}

      <div className="md:mb-4 md:grid md:grid-cols-2 md:items-stretch md:gap-3 lg:grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))] lg:gap-4">
        <div className="md:col-span-2 md:[&>div]:mb-0 lg:col-span-1">
          <DayHero
            briefing={dayBriefing(rows, new Date(), date === today)}
            isToday={date === today}
            receivedCents={receivedCents(rows)}
            forecastCents={forecastCents(rows)}
          />
        </div>
        {desk ? (
          <div className="hidden md:contents">
            <Suspense fallback={[0, 1, 2].map((i) => <BoxSkeleton key={i} h="h-28" />)}>
              <DeskKpis {...p} />
            </Suspense>
          </div>
        ) : null}
      </div>

      <div className="md:grid md:gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 md:grid md:gap-4">
          {desk ? (
            <div className="hidden md:block">
              <Suspense fallback={<BoxSkeleton h="h-52" />}>
                <DeskNext {...p} />
              </Suspense>
            </div>
          ) : null}
          <div className="min-w-0">
            <ProfessionalFilter choices={scope.choices} active={scope.filterId} />
            {desk ? (
              <AgendaTabs
                day={<DaySchedule tenantId={tenantId} date={date} withStrip base="/agenda" actions={false} scope={scope} />}
                week={
                  <Suspense fallback={<BoxSkeleton h="h-48" />}>
                    <DeskWeek {...p} />
                  </Suspense>
                }
              />
            ) : (
              <DaySchedule tenantId={tenantId} date={date} withStrip base="/agenda" actions={false} scope={scope} />
            )}
          </div>
        </div>
        {desk ? (
          <aside aria-label="Resumo do salão" className="hidden md:grid md:grid-cols-2 md:items-start md:gap-4 lg:grid-cols-1">
            <Suspense
              fallback={
                <>
                  <BoxSkeleton h="h-80" />
                  <BoxSkeleton h="h-40" />
                  <BoxSkeleton h="h-40" />
                </>
              }
            >
              <DeskSide {...p} />
            </Suspense>
          </aside>
        ) : null}
      </div>
    </PageShell>
  );
}
