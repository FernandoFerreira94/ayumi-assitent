import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listDay } from "@/features/appointments/core";
import { listBlocks } from "@/features/blocks/core";
import { importExternalEvents } from "@/features/google/server";
import { getHours } from "@/features/hours/core";
import { CopyButton } from "@/features/hours/CopyButton";
import { SlotButton } from "@/features/hours/SlotButton";
import { freeSlots, weekdayOf } from "@/features/hours/slots";
import { listBookable } from "@/features/services/core";
import { addDays, dayRange, formatDayTitle, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Vagas" };

const short = (date: string) =>
  `${formatDayTitle(date).split(",")[0].slice(0, 3)}, ${date.slice(8)}/${date.slice(5, 7)}`;

export default async function VagasPage({ searchParams }: PageProps<"/vagas">) {
  await connection(); // depende do relógio
  const { s } = await searchParams;
  const { tenantId } = await requireTenant();
  const today = todayStr();
  const now = new Date();

  await importExternalEvents(tenantId);
  const { services, week, busy } = await withTenant(tenantId, async (tx) => {
    const range: [Date, Date] = [dayRange(today)[0], dayRange(addDays(today, 6))[1]];
    const [appts, blks] = await Promise.all([listDay(tx, range), listBlocks(tx, range)]);
    return {
      // "Mostrar nas vagas" desligado tira o serviço da mensagem de horários livres
      services: (await listBookable(tx)).filter((x) => x.showInSlots),
      week: await getHours(tx),
      // o intervalo depois de cada atendimento também ocupa a agenda
      busy: [...appts.map((a) => ({ startsAt: a.startsAt, endsAt: a.blockedUntil })), ...blks],
    };
  });

  if (services.length === 0) {
    return (
      <PageShell back title="Vagas">
        <EmptyState
          title="Nenhum serviço cadastrado"
          description="Para ver os horários livres, adicione um serviço."
          action={
            <Link
              href="/servicos?novo=1"
              className="btn-tint inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold"
            >
              Novo serviço
            </Link>
          }
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
  const text = withSlots.length
    ? `Horários disponíveis para ${service.name}:\n\n${withSlots.map((d) => `${short(d.date)}: ${d.slots.join(", ")}`).join("\n")}\n\nQual prefere?`
    : "";

  return (
    <PageShell back title="Vagas" subtitle="Toque num horário para agendar">
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
        <Link
          href="/servicos?novo=1"
          className="btn-tint inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-sm font-bold"
        >
          + Serviço
        </Link>
      </nav>
      {withSlots.length === 0 ? (
        <EmptyState
          title="Sem vagas nos próximos dias"
          description="Confira o expediente em Ajustes ou libere horários na agenda."
        />
      ) : (
        <div className="grid gap-3">
          {/* No topo: é a ação da tela, não precisa rolar a semana até achar */}
          <CopyButton text={text} />
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
