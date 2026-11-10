import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { AppointmentCard } from "@/features/appointments/AppointmentCard";
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
      past={past}
    />
  );

  return (
    <PageShell back title="Pendências" subtitle={countPendencias(p) ? `${countPendencias(p)} para resolver` : undefined}>
      {countPendencias(p) === 0 ? (
        <EmptyState
          icon="checkCircle"
          title="Tudo em dia"
          description="Nenhum atendimento esperando confirmação, fechamento ou envio ao Google."
        />
      ) : (
        <div className="grid gap-5">
          {p.toReschedule.length > 0 ? (
            <section aria-labelledby="remarcar" className="grid gap-2">
              <h2 id="remarcar" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                Querem remarcar
              </h2>
              <ul className="grid gap-2">{p.toReschedule.map((r) => card(r))}</ul>
            </section>
          ) : null}
          {p.toClose.length > 0 ? (
            <section aria-labelledby="fechar" className="grid gap-2">
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 id="fechar" className="text-sm font-bold uppercase tracking-wide text-muted">
                  Para fechar (já passaram)
                </h2>
                {p.toClose.length > 1 ? (
                  <CloseAllButton items={p.toClose.map((r) => ({ id: r.id, status: r.status }))} />
                ) : null}
              </div>
              <ul className="grid gap-2">{p.toClose.map((r) => card(r, true))}</ul>
            </section>
          ) : null}
          {p.toConfirm.length > 0 ? (
            <section aria-labelledby="confirmar" className="grid gap-2">
              <h2 id="confirmar" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                Aguardando confirmação
              </h2>
              <ul className="grid gap-2">{p.toConfirm.map((r) => card(r))}</ul>
            </section>
          ) : null}
          {p.unsynced.length > 0 ? (
            <section aria-labelledby="google" className="grid gap-2">
              <h2 id="google" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                Fora do Google Agenda
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
