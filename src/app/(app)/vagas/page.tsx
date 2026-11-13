import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listDay } from "@/features/appointments/core";
import { listBlocks } from "@/features/blocks/core";
import { syncExternalCalendars } from "@/features/blocks/external-sync";
import { getHours } from "@/features/hours/core";
import { CustomSheet } from "@/features/hours/CustomSheet";
import { shortDayLabel } from "@/features/hours/custom-slots";
import { ShareSheet } from "@/features/hours/ShareSheet";
import { listSlotLists } from "@/features/hours/slot-lists";
import { SlotButton } from "@/features/hours/SlotButton";
import { freeSlots, weekdayOf } from "@/features/hours/slots";
import { NewServiceSheet } from "@/features/services/NewServiceSheet";
import { listBookable, listServices } from "@/features/services/core";
import { addDays, dayRange, formatDayTitle, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Vagas" };

export default async function VagasPage({ searchParams }: PageProps<"/vagas">) {
  await connection(); // depende do relógio
  const { s } = await searchParams;
  const { tenantId } = await requireTenant();
  const today = todayStr();
  const now = new Date();

  await syncExternalCalendars(tenantId);
  const { services, all, week, busy, lists } = await withTenant(tenantId, async (tx) => {
    const range: [Date, Date] = [dayRange(today)[0], dayRange(addDays(today, 6))[1]];
    const [appts, blks] = await Promise.all([listDay(tx, range), listBlocks(tx, range)]);
    return {
      // "Mostrar nas vagas" desligado tira o serviço da mensagem de horários livres
      services: (await listBookable(tx)).filter((x) => x.showInSlots),
      // todos, para o "+ Serviço" não deixar repetir nome
      all: (await listServices(tx)).map((x) => ({ id: x.id, name: x.name })),
      week: await getHours(tx),
      lists: await listSlotLists(tx),
      // o intervalo depois de cada atendimento também ocupa a agenda
      busy: [...appts.map((a) => ({ startsAt: a.startsAt, endsAt: a.blockedUntil })), ...blks],
    };
  });

  if (services.length === 0) {
    return (
      <PageShell title="Vagas">
        <EmptyState
          icon="scissors"
          title="Nenhum serviço cadastrado"
          description="Para ver os horários livres, adicione um serviço."
          action={<NewServiceSheet services={all} label="Novo serviço" />}
        />
      </PageShell>
    );
  }

  const service = services.find((x) => x.id === s) ?? services[0];
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((date) => ({
    date,
    slots: freeSlots({
      date,
      day: week[weekdayOf(date)],
      durationMin: service.durationMin + service.bufferMin,
      busy,
      notBefore: date === today ? now : undefined,
    }),
  }));
  const withSlots = days.filter((d) => d.slots.length > 0);

  return (
    <PageShell title="Vagas" subtitle="Toque num horário para agendar">
      <nav aria-label="Serviço" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {services.map((x) => (
          <Link
            key={x.id}
            href={`/vagas?s=${x.id}`}
            aria-current={x.id === service.id ? "true" : undefined}
            className={`min-h-11 shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${x.id === service.id ? "btn-tint" : "btn-glass"}`}
          >
            {x.name}
          </Link>
        ))}
        <NewServiceSheet services={all} />
      </nav>
      <div className="mb-3">
        <CustomSheet services={services.map((x) => ({ id: x.id, name: x.name }))} saved={lists} today={today} />
      </div>
      {withSlots.length === 0 ? (
        <EmptyState
          icon="clock"
          title="Sem vagas nos próximos dias"
          description="Confira o expediente em Ajustes > Expediente ou libere horários na agenda."
        />
      ) : (
        <div className="grid gap-3">
          {/* No topo: é a ação da tela, não precisa rolar a semana até achar */}
          <ShareSheet
            serviceName={service.name}
            days={withSlots.map((d) => ({ date: d.date, label: shortDayLabel(d.date), slots: d.slots }))}
          />
          {withSlots.map((d) => (
            <section key={d.date} aria-label={formatDayTitle(d.date)} className="glass rounded-2xl px-4 py-3">
              <h2 className="pb-2 text-sm font-bold capitalize">{formatDayTitle(d.date)}</h2>
              <ul className="flex flex-wrap gap-2">
                {d.slots.map((t) => (
                  <li key={t}>
                    <SlotButton date={d.date} time={t} serviceId={service.id} dayLabel={formatDayTitle(d.date)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
