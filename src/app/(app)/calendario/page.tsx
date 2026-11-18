import type { Metadata } from "next";
import { connection } from "next/server";
import { DaySchedule } from "@/features/appointments/DaySchedule";
import { TodayFab } from "@/features/calendar/CalendarBar";
import { parseView } from "@/features/calendar/grid";
import { isDateStr, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { loadAgendaScope } from "@/features/team/agenda-scope-server";
import { ProfessionalFilter } from "@/features/team/ProfessionalFilter";

export const metadata: Metadata = { title: "Calendário" };

/**
 * Só a visão de dia (faixa da semana e linha das horas) vem do servidor.
 * Ano e mês são desenhados pela casca do layout, sem ida ao servidor a cada troca.
 */
export default async function CalendarioPage({ searchParams }: PageProps<"/calendario">) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const today = todayStr();
  const view = parseView({ v: str("v"), y: str("y"), m: str("m"), d: str("d") }, today, isDateStr);
  if (view.kind !== "day") return null;
  const me = await requireTenant();
  const scope = await loadAgendaScope(me);
  return (
    <>
      <ProfessionalFilter choices={scope.choices} active={scope.filterId} />
      <DaySchedule tenantId={me.tenantId} date={view.date} withStrip calendar scope={scope} />
      {view.date === today ? null : <TodayFab href={`/calendario?d=${today}`} />}
    </>
  );
}
