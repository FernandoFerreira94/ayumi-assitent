import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { getMessageSettings } from "@/features/reminders/core";
import { MessagesForm } from "@/features/reminders/MessagesForm";
import { AiRepliesForm } from "@/features/salon/AiRepliesForm";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Mensagens para a cliente" };

/** Ajustes > Mensagens: textos do agendamento e dos avisos no WhatsApp, e a leitura das respostas pela IA. */
export default async function MensagensPage() {
  const { tenantId } = await requireTenant();
  const [messages, [salon]] = await Promise.all([
    withTenant(tenantId, (tx) => getMessageSettings(tx)),
    getDb().select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  return (
    <PageShell back backHref="/ajustes" title="Mensagens">
      <div className="grid gap-3">
        <section id="mensagens" aria-label="Mensagens no WhatsApp" className="scroll-mt-6">
          <MessagesForm settings={messages} salonName={salon?.name ?? ""} />
        </section>
        <section id="ia" aria-label="Leitura das respostas" className="scroll-mt-6">
          <AiRepliesForm />
        </section>
      </div>
    </PageShell>
  );
}
