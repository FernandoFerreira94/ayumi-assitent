import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { shellStatus } from "@/features/shell/status";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "WhatsApp" };

/** Ajustes > WhatsApp: conectar o número do salão (por onde saem confirmações e avisos). */
export default async function WhatsAppPage() {
  const { tenantId } = await requireTenant();
  const [{ whatsapp }, [t]] = await Promise.all([
    shellStatus(tenantId),
    getDb().select({ phone: tenants.businessPhone }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  // Telefone do Meu perfil (E.164) vem como sugestão no campo do número ao conectar
  const profilePhone = t?.phone ? maskPhone(t.phone.replace(/^\+55/, "")) : "";
  return (
    <PageShell back backHref="/ajustes" title="WhatsApp">
      <section id="whatsapp" aria-label="WhatsApp" className="scroll-mt-6">
        <WhatsAppCard initial={whatsapp} profilePhone={profilePhone} />
      </section>
    </PageShell>
  );
}
