import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { AppointmentCard } from "@/features/appointments/AppointmentCard";
import { forecastCents, listDay } from "@/features/appointments/core";
import { countPendencias, listPendencias } from "@/features/appointments/pendencias";
import { isGoogleConnected } from "@/features/google/server";
import { BlockCard } from "@/features/blocks/BlockCard";
import { listBlocks } from "@/features/blocks/core";
import { NewBlockSheet } from "@/features/blocks/NewBlockSheet";
import { NewAppointmentSheet } from "@/features/appointments/NewAppointmentSheet";
import { searchClients } from "@/features/clients/core";
import { listServices } from "@/features/services/core";
import { addDays, dayRange, formatBRL, formatDayTitle, formatTime, isDateStr, todayStr } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Agenda" };

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const { d } = await searchParams;
  const today = todayStr();
  const date = typeof d === "string" && isDateStr(d) ? d : today;
  const { tenantId } = await requireTenant();

  const google = await isGoogleConnected(tenantId);
  const { rows, dayBlocks, clients, services, pendencias } = await withTenant(tenantId, async (tx) => ({
    dayBlocks: await listBlocks(tx, dayRange(date)),
    pendencias: countPendencias(await listPendencias(tx, new Date(), google)),
    rows: await listDay(tx, dayRange(date)),
    clients: await searchClients(tx, ""),
    services: await listServices(tx),
  }));

  const week = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  const title = date === today ? "Hoje" : "Agenda";

  return (
    <PageShell title={title} subtitle={formatDayTitle(date)}>
      {pendencias > 0 ? (
        <Link
          href="/pendencias"
          className="mb-3 flex min-h-11 items-center justify-between rounded-2xl bg-soft px-4 text-sm font-bold text-primary-text"
        >
          <span>Pendências para resolver</span>
          <span
            className="rounded-full bg-primary px-2.5 py-0.5 text-on-primary"
            aria-label={`${pendencias} pendências`}
          >
            {pendencias}
          </span>
        </Link>
      ) : null}
      {date !== today ? (
        <div className="mb-3 flex justify-end">
          <Link
            href="/agenda"
            className="min-h-11 rounded-full bg-soft px-4 text-sm font-bold leading-[2.75rem] text-primary-text active:scale-[0.97]"
          >
            Hoje
          </Link>
        </div>
      ) : null}
      <nav aria-label="Dias" className="mb-4 grid grid-cols-7 gap-1.5">
        {week.map((day) => {
          const sel = day === date;
          const isToday = day === today;
          const num = Number(day.slice(8));
          const weekday = WEEKDAYS[new Date(`${day}T12:00:00`).getDay()];
          return (
            <Link
              key={day}
              href={isToday ? "/agenda" : `/agenda?d=${day}`}
              aria-current={sel ? "date" : undefined}
              aria-label={`${formatDayTitle(day)}${isToday ? " (hoje)" : ""}`}
              className={`grid min-h-16 place-content-center justify-items-center gap-0.5 rounded-2xl text-sm font-bold ${sel ? "bg-primary text-on-primary" : "bg-white text-text"} ${isToday && !sel ? "ring-2 ring-primary" : ""}`}
            >
              <span className={`text-[11px] ${sel ? "opacity-80" : "text-muted"}`}>{weekday}</span>
              {num}
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${isToday ? (sel ? "bg-on-primary" : "bg-primary") : "bg-transparent"}`}
              />
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl border border-line bg-white px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Previsto do dia</p>
          <p className="text-2xl font-bold">{formatBRL(forecastCents(rows))}</p>
        </div>
        <div className="flex gap-2">
          <NewBlockSheet date={date} />
          <NewAppointmentSheet
            date={date}
            clients={clients.map((c) => ({
              id: c.id,
              label: `${c.name} · ${maskPhone(c.phoneE164.replace(/^\+55/, ""))}`,
            }))}
            services={services.map((s) => ({ id: s.id, label: s.name, priceCents: s.priceCents }))}
          />
        </div>
      </div>

      {rows.length === 0 && dayBlocks.length === 0 ? (
        <EmptyState title="Dia livre" description="Nenhum atendimento neste dia. Toque em Agendar para criar um." />
      ) : (
        <ul className="grid gap-2">
          {[
            ...rows.map((r) => ({
              at: r.startsAt,
              node: (
                <AppointmentCard
                  key={r.id}
                  id={r.id}
                  time={formatTime(r.startsAt)}
                  clientName={r.clientName}
                  serviceName={r.serviceName}
                  price={formatBRL(r.priceCents)}
                  status={r.status}
                />
              ),
            })),
            ...dayBlocks.map((b) => ({
              at: b.startsAt,
              node: (
                <BlockCard
                  key={b.id}
                  id={b.id}
                  date={date}
                  start={formatTime(b.startsAt)}
                  end={formatTime(b.endsAt)}
                  reason={b.reason}
                />
              ),
            })),
          ]
            .sort((x, y) => x.at.getTime() - y.at.getTime())
            .map((x) => x.node)}
        </ul>
      )}
    </PageShell>
  );
}
