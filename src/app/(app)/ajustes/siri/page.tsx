import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { SiriBody } from "@/features/settings/connection-bodies";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Siri e Atalhos" };

/** Ajustes > Siri e Atalhos: chave só de leitura para consultar a agenda pela Siri. */
export default async function SiriPage() {
  const { tenantId } = await requireTenant();
  return (
    <PageShell back backHref="/ajustes" title="Siri e Atalhos">
      <SiriBody tenantId={tenantId} />
    </PageShell>
  );
}
