import { Skeleton } from "@/components/ui/Skeleton";
import { errCode, log } from "@/lib/log";
import { loadDashboard, type Dashboard } from "./data";
import { DeskError } from "./DeskError";
import { MiniMonth } from "./MiniMonth";
import { NextClient } from "./NextClient";
import { PeriodCards } from "./PeriodCards";
import { PendingCard, ReturnsCard, ShortcutsCard, SlotsCard } from "./SideCards";
import { WeekGlance } from "./WeekGlance";

/**
 * Caixas do Painel que só aparecem no tablet/desktop. Cada uma é um componente do servidor separado
 * (entram em lugares diferentes da grade); `loadDashboard` tem `cache`, então o banco é lido uma vez.
 */
type P = { tenantId: string; date: string };

/** Lê os dados; se falhar, a caixa mostra o erro com "Tentar de novo" e o resto do Painel segue. */
async function load(tenantId: string, date: string): Promise<Dashboard | null> {
  try {
    return await loadDashboard(tenantId, date);
  } catch (e) {
    log("error", "painel: falha ao carregar caixas do desktop", errCode(e));
    return null;
  }
}

export async function DeskKpis({ tenantId, date }: P) {
  const d = await load(tenantId, date);
  if (!d) return <DeskError what="os números" />;
  return <PeriodCards week={d.week} month={d.month} confirm={d.confirm} />;
}

export async function DeskNext({ tenantId, date }: P) {
  const d = await load(tenantId, date);
  if (!d) return <DeskError what="a próxima cliente" />;
  return <NextClient next={d.next} isToday={date === d.today} />;
}

export async function DeskWeek({ tenantId, date }: P) {
  const d = await load(tenantId, date);
  if (!d) return <DeskError what="a semana" />;
  return <WeekGlance week={d.viewWeek} date={date} today={d.today} />;
}

export async function DeskSide({ tenantId, date }: P) {
  const d = await load(tenantId, date);
  if (!d) return <DeskError what="o resumo" />;
  return (
    <>
      <MiniMonth key={date} date={date} today={d.today} initialYear={d.year} closedDays={d.closedDays} />
      <PendingCard pend={d.pend} />
      <ReturnsCard due={d.due} />
      <SlotsCard slots={d.slots} />
      <ShortcutsCard today={d.today} />
    </>
  );
}

/** Carregando de uma caixa, com a mesma altura aproximada da pronta. */
export function BoxSkeleton({ h = "h-32" }: { h?: string }) {
  return <Skeleton className={`${h} w-full rounded-[1.75rem]`} />;
}
