import type { Metadata } from "next";
import { TileTitle } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { KpiCard } from "@/features/admin/ui/KpiCard";
import { UsageTable } from "@/features/admin/ui/UsageTable";
import { getUsage } from "@/features/admin/usage";
import { summarizeUsage } from "@/features/admin/usage-rules";

export const metadata: Metadata = { title: "Uso" };

const num = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** Uso real do produto (não depende da cobrança): quem está usando, quanto agenda e quanto WhatsApp gasta. */
export default async function AdminUsagePage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_usage" });
  const now = new Date();
  const rows = await getUsage();
  const s = summarizeUsage(rows, now);

  return (
    <AdminShell title="Uso" subtitle="Dados reais dos salões nos últimos 30 dias" icon="forecast" tint="teal">
      <h2 className="sr-only">Resumo</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard icon="users" tint="blue" tone="brand" label="Salões" value={num(s.salons)} note={`${s.active7} usaram nos últimos 7 dias`} />
        <KpiCard icon="chat" tint="green" tone="ok" label="WhatsApp ligado" value={num(s.whatsapp)} note={`de ${s.salons} salões`} />
        <KpiCard icon="calendar" tint="lavender" label="Agendamentos" value={num(s.appts30)} note="últimos 30 dias, sem cancelados" />
        <KpiCard icon="message" tint="teal" label="Mensagens enviadas" value={num(s.msgsOut30)} note="últimos 30 dias" />
        <KpiCard
          icon="forecast"
          tint="orange"
          label="Por salão ativo"
          value={s.msgsPerActive === null ? "—" : num(s.msgsPerActive)}
          note="mensagens no mês (base do custo)"
        />
      </div>
      <TileTitle as="h2" icon="users" tint="blue" className="pb-3 text-lg">
        Por salão
      </TileTitle>
      <UsageTable rows={rows} now={now} />
    </AdminShell>
  );
}
