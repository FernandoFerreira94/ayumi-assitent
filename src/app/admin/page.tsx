import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";

export const metadata: Metadata = { title: "Visão geral" };

/** Visão geral do painel. Os números (MRR, recebido, atrasos) entram no Bloco 3, quando a cobrança estiver na main. */
export default async function AdminOverviewPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_overview" });
  return (
    <AdminShell title="Visão geral" subtitle="Assinaturas e receita do Bubbly">
      <EmptyState
        icon="coins"
        title="Os números chegam com a cobrança"
        description="Quando os pagamentos entrarem no ar, aqui aparecem MRR, recebido no mês, atrasos e testes grátis."
      />
    </AdminShell>
  );
}
