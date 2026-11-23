import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listAhead } from "@/features/appointments/agendamentos";
import { DepositAgenda, type AgendaItem } from "@/features/appointments/DepositAgenda";
import { isGroup, isPeriod } from "@/features/appointments/deposit-list";
import { paymentView } from "@/features/appointments/payment";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Agendamentos" };

/** Lista dos próximos agendamentos com o sinal de cada um (só visão; ações em folha). `?periodo=` e `?sinal=`. */
export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; sinal?: string }>;
}) {
  await connection();
  const { tenantId } = await requireTenant();
  const sp = await searchParams;
  const rows = await withTenant(tenantId, (tx) => listAhead(tx, new Date()));

  const items: AgendaItem[] = rows.map((r) => ({
    id: r.id,
    startsAt: r.startsAt,
    minutes: Math.round((r.endsAt.getTime() - r.startsAt.getTime()) / 60_000),
    clientId: r.clientId,
    clientName: r.clientName,
    clientPhone: maskPhone(r.clientPhone.replace(/^\+55/, "")),
    serviceId: r.serviceId,
    serviceName: r.serviceName,
    priceCents: r.priceCents,
    status: r.status,
    payment: paymentView(r),
  }));

  return (
    <PageShell back wide title="Agendamentos" subtitle="Quem pagou o sinal">
      {items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nenhum agendamento pela frente"
          description="Quando você agendar, a cliente aparece aqui com o sinal: pago, pedido ou sem sinal."
        />
      ) : (
        <DepositAgenda
          items={items}
          initialPeriod={isPeriod(sp.periodo) ? sp.periodo : "semana"}
          initialGroup={isGroup(sp.sinal) ? sp.sinal : null}
        />
      )}
    </PageShell>
  );
}
