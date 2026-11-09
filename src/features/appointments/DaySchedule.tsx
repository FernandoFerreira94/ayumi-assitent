import { withTenant } from "@/db/client";
import { AgendaDay } from "@/features/appointments/AgendaDay";
import { daySpan, gridWindow, serviceTone, weekOf } from "@/features/appointments/agenda-grid";
import { AgendaRefresh } from "@/features/appointments/AgendaRefresh";
import { dayVersion } from "@/features/appointments/version";
import { forecastCents, listDay } from "@/features/appointments/core";
import { minuteOf } from "@/features/appointments/timeline";
import { WeekStrip } from "@/features/appointments/WeekStrip";
import { listBlocks } from "@/features/blocks/core";
import { importExternalEvents } from "@/features/google/server";
import { getHours } from "@/features/hours/core";
import { weekdayOf } from "@/features/hours/slots";
import { NewBlockSheet } from "@/features/blocks/NewBlockSheet";
import { bookingOptions } from "@/features/appointments/options";
import { searchClients } from "@/features/clients/core";
import { listBookable } from "@/features/services/core";
import { addDays, dayRange, formatBRL, todayStr } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";

/** Semanas carregadas antes e depois da semana do dia escolhido. */
const WEEK_RADIUS = 5;

/**
 * Dia da agenda (linha do dia com arrastar para remarcar, agendar e bloquear).
 * Usado no Painel (só hoje) e no Calendário (com a faixa de semanas), para os dois se comportarem igual.
 */
export async function DaySchedule({
  tenantId,
  date,
  withStrip,
  base = "/calendario",
  calendar = false,
}: {
  tenantId: string;
  date: string;
  withStrip: boolean;
  /** Página que recebe o dia escolhido na faixa da semana. */
  base?: string;
  calendar?: boolean;
}) {
  const today = todayStr();
  // Janela de semanas para a rolagem lateral da faixa; ao rolar além dela a faixa recentraliza
  const weeks = Array.from({ length: 2 * WEEK_RADIUS + 1 }, (_, i) => weekOf(addDays(date, (i - WEEK_RADIUS) * 7)));
  // Uma consulta para a janela toda: os pontinhos da faixa saem dela e o dia é filtrado daqui
  const weekRange: [Date, Date] = [dayRange(weeks[0][0])[0], dayRange(weeks[weeks.length - 1][6])[1]];

  await importExternalEvents(tenantId);
  const { weekRows, dayBlocks, clients, services, openHours } = await withTenant(tenantId, async (tx) => ({
    openHours: await getHours(tx),
    dayBlocks: await listBlocks(tx, dayRange(date)),
    weekRows: await listDay(tx, weekRange),
    clients: await searchClients(tx, ""),
    services: await listBookable(tx),
  }));

  const rows = weekRows.filter((r) => todayStr(r.startsAt) === date);
  const version = dayVersion(rows, dayBlocks);
  const hours = daySpan(openHours[weekdayOf(date)]);
  const span = (s: Date, e: Date) => ({ start: minuteOf(s), end: minuteOf(e) });
  const appointments = rows.map((r) => ({
    kind: "appointment" as const,
    ...span(r.startsAt, r.endsAt),
    id: r.id,
    clientId: r.clientId,
    clientName: r.clientName,
    clientPhone: maskPhone(r.clientPhone.replace(/^\+55/, "")),
    serviceId: r.serviceId,
    serviceName: r.serviceName,
    price: formatBRL(r.priceCents),
    status: r.status,
    tone: serviceTone(r.serviceId),
  }));
  const blocks = dayBlocks.map((b) => ({
    kind: "block" as const,
    ...span(b.startsAt, b.endsAt),
    id: b.id,
    reason: b.reason,
    external: b.source === "google",
  }));
  const busyDays = new Set(weekRows.map((r) => todayStr(r.startsAt)));
  const n = rows.length;
  const summary =
    n === 0
      ? hours
        ? "Nenhum atendimento ainda"
        : "Salão fechado"
      : `${n} atendimento${n === 1 ? "" : "s"} · previsto ${formatBRL(forecastCents(rows))}`;

  return (
    <>
      <AgendaRefresh key={version} date={date} version={version} />
      {withStrip ? (
        <div data-tour="days">
          <WeekStrip
            date={date}
            today={today}
            summary={summary}
            base={base}
            calendar={calendar}
            weeks={weeks.map((wk) =>
              wk.map((w) => ({ date: w, has: busyDays.has(w), closed: !openHours[weekdayOf(w)] })),
            )}
          />
        </div>
      ) : null}
      {/* No Calendário o corpo do dia desliza para o lado ao trocar de dia */}
      <div data-day-body={calendar || undefined}>
        <AgendaDay
          key={date}
          date={date}
          win={gridWindow([...appointments, ...blocks])}
          hours={hours}
          appointments={appointments}
          blocks={blocks}
          nowMin={date === today ? minuteOf(new Date()) : null}
          {...bookingOptions(clients, services)}
          blockButton={<NewBlockSheet date={date} />}
        />
      </div>
    </>
  );
}
