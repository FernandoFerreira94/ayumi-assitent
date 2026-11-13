import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { shellStatus } from "@/features/shell/status";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "WhatsApp" };

/** Ajustes > WhatsApp: conectar o número do salão (por onde saem confirmações e avisos). */
export default async function WhatsAppPage() {
  const { tenantId } = await requireTenant();
  const { whatsapp } = await shellStatus(tenantId);
  return (
    <PageShell back backHref="/ajustes" title="WhatsApp">
      <section id="whatsapp" aria-label="WhatsApp" className="scroll-mt-6">
        <WhatsAppCard initial={whatsapp} />
      </section>
    </PageShell>
  );
}
