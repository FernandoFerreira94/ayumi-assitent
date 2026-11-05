import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { AppointmentCard } from "@/features/appointments/AppointmentCard";
import { forecastCents, listDay } from "@/features/appointments/core";
import { NewAppointmentSheet } from "@/features/appointments/NewAppointmentSheet";
import { searchClients } from "@/features/clients/core";
import { listServices } from "@/features/services/core";
import { addDays, dayRange, formatBRL, formatDayTitle, formatTime, isDateStr, todayStr } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await connection(); // "hoje" depende do relógio: renderiza a cada pedido
  const { d } = await searchParams;
  const today = todayStr();
  const date = typeof d === "string" && isDateStr(d) ? d : today;
  const { tenantId } = await requireTenant();

  const { rows, clients, services } = await withTenant(tenantId, async (tx) => ({
    rows: await listDay(tx, dayRange(date)),
    clients: await searchClients(tx, ""),
    services: await listServices(tx),
  }));

  const week = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  const title = date === today ? "Hoje" : "Agenda";

  return (
    <PageShell title={title} subtitle={formatDayTitle(date)}>
      <nav aria-label="Dias" className="mb-4 grid grid-cols-7 gap-1.5">
        {week.map((day) => {
          const sel = day === date;
          const num = Number(day.slice(8));
          return (
            <Link
              key={day}
              href={day === today ? "/agenda" : `/agenda?d=${day}`}
              aria-current={sel ? "date" : undefined}
              aria-label={formatDayTitle(day)}
              className={`grid min-h-14 place-items-center rounded-2xl text-sm font-bold ${sel ? "bg-primary text-on-primary" : "bg-white text-text"}`}
            >
              {num}
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl border border-line bg-white px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Previsto do dia</p>
          <p className="text-2xl font-bold">{formatBRL(forecastCents(rows))}</p>
        </div>
        <NewAppointmentSheet
          date={date}
          clients={clients.map((c) => ({
            id: c.id,
            label: `${c.name} · ${maskPhone(c.phoneE164.replace(/^\+55/, ""))}`,
          }))}
          services={services.map((s) => ({ id: s.id, label: s.name, priceCents: s.priceCents }))}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Dia livre" description="Nenhum atendimento neste dia. Toque em Agendar para criar um." />
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <AppointmentCard
              key={r.id}
              id={r.id}
              time={formatTime(r.startsAt)}
              clientName={r.clientName}
              serviceName={r.serviceName}
              price={formatBRL(r.priceCents)}
              status={r.status}
            />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
