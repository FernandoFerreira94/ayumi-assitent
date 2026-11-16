import type { Metadata } from "next";
import { connection } from "next/server";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { TodayFab } from "@/features/calendar/CalendarBar";
import { parseView } from "@/features/calendar/grid";
import { ViewSwitch } from "@/features/calendar/ViewSwitch";
import { WeekSchedule } from "@/features/calendar/WeekSchedule";
import { isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Calendário" };

/**
 * Só as visões de dia (faixa da semana e linha das horas) e de semana (desktop) vêm do servidor.
 * Ano e mês são desenhados pela casca do layout, sem ida ao servidor a cada troca.
 */
export default async function CalendarioPage({ searchParams }: PageProps<"/calendario">) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const today = todayStr();
  const view = parseView({ v: str("v"), y: str("y"), m: str("m"), d: str("d") }, today, isDateStr);
  if (view.kind !== "day" && view.kind !== "week") return null;
  const { tenantId } = await requireTenant();
  if (view.kind === "week") return <WeekSchedule tenantId={tenantId} date={view.date} />;
  return (
    <>
      <div className="mb-2 hidden justify-end lg:flex">
        <ViewSwitch current="day" date={view.date} />
      </div>
      <DaySchedule tenantId={tenantId} date={view.date} withStrip calendar />
      {view.date === today ? null : <TodayFab href={`/calendario?d=${today}`} />}
    </>
  );
}
