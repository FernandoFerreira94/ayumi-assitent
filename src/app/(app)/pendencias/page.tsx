import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { AppointmentCard } from "@/features/appointments/AppointmentCard";
import { paymentView } from "@/features/appointments/payment";
import { CloseAllButton } from "@/features/appointments/CloseAllButton";
import { countPendencias, listPendencias } from "@/features/appointments/pendencias";
import { RetrySyncButton } from "@/features/google/RetrySyncButton";
import { isGoogleConnected } from "@/features/google/server";
import { formatBRL, formatTime, todayStr } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Pendências" };

const when = (d: Date) =>
  `${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(d)} ${formatTime(d)}`;

/** Coluna do quadro no desktop (no celular, só a seção empilhada de sempre). */
const COL = "grid gap-2 lg:rounded-[1.75rem] lg:bg-[color-mix(in_srgb,var(--surface)_45%,transparent)] lg:p-3";

/** Quantos tem na coluna (só no desktop, onde as colunas ficam lado a lado). */
const Count = ({ n }: { n: number }) => (
  <span className="ml-1 hidden rounded-full bg-soft px-2 py-0.5 align-middle text-xs normal-case tracking-normal text-primary-text lg:inline">
    {n}
  </span>
);

export default async function PendenciasPage() {
  await connection();
  const { tenantId } = await requireTenant();
  const google = await isGoogleConnected(tenantId);
  const p = await withTenant(tenantId, (tx) => listPendencias(tx, new Date(), google));

  const card = (r: (typeof p.toClose)[number], past = false) => (
    <AppointmentCard
      key={r.id}
      id={r.id}
      time={when(r.startsAt)}
      date={todayStr(r.startsAt)}
      start={formatTime(r.startsAt)}
      clientId={r.clientId}
      clientName={r.clientName}
      clientPhone={maskPhone(r.clientPhone.replace(/^\+55/, ""))}
      serviceId={r.serviceId}
      serviceName={r.serviceName}
      price={formatBRL(r.priceCents)}
      status={r.status}
      payment={paymentView(r)}
      past={past}
    />
  );

  return (
    <PageShell
      back
      wide
      title="Pendências"
      subtitle={countPendencias(p) ? `${countPendencias(p)} para resolver` : undefined}
    >
      {countPendencias(p) === 0 ? (
        <EmptyState
          icon="checkCircle"
          title="Tudo em dia"
          description="Nenhum atendimento esperando confirmação, fechamento ou envio ao Google."
        />
      ) : (
        // Desktop: um quadro, cada tipo de pendência numa coluna
        <div className="grid gap-5 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-start">
          {p.toReschedule.length > 0 ? (
            <section aria-labelledby="remarcar" className={COL}>
              <h2 id="remarcar" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                Querem remarcar <Count n={p.toReschedule.length} />
              </h2>
              <ul className="grid gap-2">{p.toReschedule.map((r) => card(r))}</ul>
            </section>
          ) : null}
          {p.toClose.length > 0 ? (
            <section aria-labelledby="fechar" className={COL}>
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 id="fechar" className="text-sm font-bold uppercase tracking-wide text-muted">
                  Para fechar (já passaram) <Count n={p.toClose.length} />
                </h2>
                {p.toClose.length > 1 ? (
                  <CloseAllButton items={p.toClose.map((r) => ({ id: r.id, status: r.status }))} />
                ) : null}
              </div>
              <ul className="grid gap-2">{p.toClose.map((r) => card(r, true))}</ul>
            </section>
          ) : null}
          {p.toConfirm.length > 0 ? (
            <section aria-labelledby="confirmar" className={COL}>
              <h2 id="confirmar" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                Aguardando confirmação <Count n={p.toConfirm.length} />
              </h2>
              <ul className="grid gap-2">{p.toConfirm.map((r) => card(r))}</ul>
            </section>
          ) : null}
          {p.unsynced.length > 0 ? (
            <section aria-labelledby="google" className={COL}>
              <h2 id="google" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                Fora do Google Agenda <Count n={p.unsynced.length} />
              </h2>
              <ul className="grid gap-2">
                {p.unsynced.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 glass rounded-2xl px-4 py-3">
                    <div>
                      <p className="font-bold">
                        <span className="text-primary-text">{when(r.startsAt)}</span> · {r.clientName}
                      </p>
                      <p className="text-sm font-semibold text-muted">{r.serviceName}</p>
                    </div>
                    <RetrySyncButton id={r.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
