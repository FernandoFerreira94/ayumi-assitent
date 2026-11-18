import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { NotificationsBody } from "@/features/settings/connection-bodies";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Notificações" };

/** Ajustes > Notificações: avisos neste aparelho e a cidade (previsão do tempo e feriados do bom dia). */
export default async function NotificacoesPage() {
  const { tenantId } = await requireTenant();
  return (
    <PageShell back backHref="/ajustes" title="Notificações">
      <div className="grid gap-3">
        <NotificationsBody tenantId={tenantId} />
      </div>
    </PageShell>
  );
}
