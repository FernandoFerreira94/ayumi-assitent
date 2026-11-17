import { withTenant } from "@/db/client";
import { breakSpan, gridWindow, weekOf } from "@/features/appointments/agenda-grid";
import { listDay } from "@/features/appointments/core";
import { minuteOf } from "@/features/appointments/timeline";
import { listBlocks } from "@/features/blocks/core";
import { syncExternalCalendars } from "@/features/blocks/external-sync";
import { getHours } from "@/features/hours/core";
import { weekdayOf } from "@/features/hours/slots";
import { dayRange, todayStr } from "@/lib/dates";
import { spreadByDay } from "./week";
import { WeekGrid, type WeekDay, type WeekItem } from "./WeekGrid";

const first = (n: string) => n.trim().split(/\s+/)[0];

/**
 * Semana do Calendário (desktop): os 7 dias lado a lado, em uma consulta de atendimentos
 * e uma de bloqueios para a semana inteira (sem uma ida ao banco por dia).
 */
export async function WeekSchedule({ tenantId, date }: { tenantId: string; date: string }) {
  const days = weekOf(date);
  const range: [Date, Date] = [dayRange(days[0])[0], dayRange(days[6])[1]];
  await syncExternalCalendars(tenantId);
  const { rows, blocks, openHours } = await withTenant(tenantId, async (tx) => ({
    openHours: await getHours(tx),
    rows: await listDay(tx, range),
    blocks: await listBlocks(tx, range),
  }));

  const apptCols = spreadByDay(rows, days);
  const blockCols = spreadByDay(blocks, days);
  const span = (s: Date, e: Date) => ({ start: minuteOf(s), end: minuteOf(e) });
  const cols: WeekDay[] = days.map((d, i) => {
    const items: WeekItem[] = [
      ...blockCols[i].map((b) => ({
        kind: "block" as const,
        ...span(b.startsAt, b.endsAt),
        id: b.id,
        label: b.reason ?? "Bloqueado",
        external: b.source === "google" || b.source === "icloud",
      })),
      ...apptCols[i].map((r) => ({
        kind: "appointment" as const,
        ...span(r.startsAt, r.endsAt),
        id: r.id,
        label: first(r.clientName),
        sub: r.serviceName,
        color: r.serviceColor,
        status: r.status,
      })),
    ];
    const day = openHours[weekdayOf(d)];
    return { date: d, closed: !day, pause: breakSpan(day), items };
  });
  // Uma janela só para os 7 dias, para as horas baterem de coluna em coluna
  const win = gridWindow(cols.flatMap((c) => c.items));
  const today = todayStr();
  return <WeekGrid days={cols} win={win} today={today} nowMin={days.includes(today) ? minuteOf(new Date()) : null} />;
}

