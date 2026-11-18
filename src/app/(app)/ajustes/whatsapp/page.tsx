import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { WhatsAppBody } from "@/features/settings/connection-bodies";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "WhatsApp" };

/** Ajustes > WhatsApp: conectar o número do salão (por onde saem confirmações e avisos). */
export default async function WhatsAppPage() {
  const { tenantId } = await requireTenant();
  return (
    <PageShell back backHref="/ajustes" title="WhatsApp">
      <WhatsAppBody tenantId={tenantId} />
    </PageShell>
  );
}
