import type { Metadata } from "next";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { monthKey, shiftMonth } from "@/features/admin/month";
import { getOverview, getPayments, BILLING_LIVE } from "@/features/admin/queries";
import type { PaymentRow } from "@/features/admin/types";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { BillingPending } from "@/features/admin/ui/BillingPending";
import { SubscriberSheet } from "@/features/admin/ui/SubscriberSheet";
import { SubscribersView } from "@/features/admin/ui/SubscribersView";

export const metadata: Metadata = { title: "Assinantes" };

/** Assinantes: lista com abas e filtros. ?salao=<id> abre o detalhe (e fica no registro de acessos). */
export default async function AdminSubscribersPage({ searchParams }: PageProps<"/admin/assinantes">) {
  const { userId } = await requireAdmin();
  const sp = await searchParams;
  const salao = typeof sp.salao === "string" ? sp.salao : null;
  const now = new Date();
  const rows = await getOverview();
  const row = salao ? (rows.find((r) => r.tenantId === salao) ?? null) : null;

  let payments: PaymentRow[] = [];
  if (row) {
    await logAdminAccess({ userId, action: "view_subscriber", target: row.tenantId });
    const cur = monthKey(now);
    const months = await Promise.all([0, -1, -2].map((n) => getPayments(shiftMonth(cur, n))));
    payments = months.flat().filter((p) => p.tenantId === row.tenantId);
  } else {
    await logAdminAccess({ userId, action: "view_subscribers" });
  }

  if (!BILLING_LIVE)
    return (
      <AdminShell title="Assinantes" subtitle="Planos e situação de cada salão" icon="users" tint="blue">
        <BillingPending what="Plano, situação (teste, ativa, em atraso) e vencimento de cada salão" />
      </AdminShell>
    );

  return (
    <AdminShell title="Assinantes" subtitle={`${rows.length} salões com assinatura`} icon="users" tint="blue">
      <SubscribersView rows={rows} />
      <SubscriberSheet row={row} payments={payments} />
    </AdminShell>
  );
}
