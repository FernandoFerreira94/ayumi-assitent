import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { GoogleCard } from "@/features/google/GoogleCard";
import { isGoogleConnected } from "@/features/google/server";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { getMessageSettings } from "@/features/reminders/core";
import { MessagesForm } from "@/features/reminders/MessagesForm";
import { AiRepliesForm } from "@/features/salon/AiRepliesForm";
import { PushToggle } from "@/features/push/PushToggle";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { InstallGuide } from "@/features/install/InstallGuide";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { ensureWebhook } from "@/features/whatsapp/webhook";
import { UpdateButton } from "@/features/update/UpdateButton";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { requireTenant } from "@/lib/tenant";
import { whatsappState } from "@/features/shell/status";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage({ searchParams }: PageProps<"/ajustes">) {
  const { tenantId } = await requireTenant();
  const { google: googleResult, error: googleError } = await searchParams;
  const { week, messages } = await withTenant(tenantId, async (tx) => ({
    week: await getHours(tx),
    messages: await getMessageSettings(tx),
  }));
  const [wa, google, [salon]] = await Promise.all([
    whatsappState(tenantId),
    isGoogleConnected(tenantId),
    getDb()
      .select({ i: tenants.whatsappInstance, name: tenants.name, aiRules: tenants.aiRules })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  // WhatsApp conectado antes de existir o webhook: abrir Ajustes já liga as respostas
  const admin = adminFromEnv();
  if (wa === "open" && admin && salon?.i) await ensureWebhook(admin, salon.i).catch(() => undefined);
  return (
    <PageShell title="Ajustes">
      {/* Grupos como os Ajustes do iPhone: o que conecta, o que a cliente recebe, a agenda e o aparelho */}
      <Group title="Conexões" first>
        <section id="whatsapp" aria-label="WhatsApp" className="scroll-mt-6">
          <WhatsAppCard initial={wa} />
        </section>
        <section id="google" aria-label="Google Agenda" className="scroll-mt-6">
          <GoogleCard
            connected={google}
            failed={googleResult === "erro" || !!googleError}
            errorCode={typeof googleError === "string" ? googleError.slice(0, 60) : undefined}
          />
        </section>
      </Group>
      <Group title="Mensagens para a cliente">
        <section id="mensagens" aria-label="Mensagens no WhatsApp" className="scroll-mt-6">
          <MessagesForm settings={messages} salonName={salon?.name ?? ""} />
        </section>
        <section id="ia" aria-label="Respostas com IA" className="scroll-mt-6">
          <AiRepliesForm rules={salon?.aiRules ?? ""} />
        </section>
      </Group>
      <Group title="Agenda">
        <section id="expediente" aria-label="Expediente" className="scroll-mt-6">
          <HoursForm week={week} />
        </section>
      </Group>
      <Group title="Este aparelho">
        <section aria-label="Avisos">
          <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
        </section>
        <section aria-label="Atualização">
          <UpdateButton />
        </section>
        <section aria-label="Tour e instalação" className="grid gap-3">
          <InstallGuide />
          <ReplayTourButton />
        </section>
      </Group>
    </PageShell>
  );
}

function Group({ title, first = false, children }: { title: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid gap-3 ${first ? "" : "mt-8"}`}>
      <h2 className="px-2 text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </div>
  );
}
