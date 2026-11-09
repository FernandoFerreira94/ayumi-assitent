import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { GoogleCard } from "@/features/google/GoogleCard";
import { isGoogleConnected } from "@/features/google/server";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { getReminderSettings } from "@/features/reminders/core";
import { ReminderForm } from "@/features/reminders/ReminderForm";
import { ReminderMessageForm } from "@/features/salon/ReminderMessageForm";
import { PushToggle } from "@/features/push/PushToggle";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { InstallGuide } from "@/features/install/InstallGuide";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { ensureWebhook } from "@/features/whatsapp/webhook";
import { UpdateButton } from "@/features/update/UpdateButton";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { LocationCard } from "@/features/weather/LocationCard";
import { requireTenant } from "@/lib/tenant";
import { whatsappState } from "@/features/shell/status";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage({ searchParams }: PageProps<"/ajustes">) {
  const { tenantId } = await requireTenant();
  const { google: googleResult, error: googleError } = await searchParams;
  const { week, reminder } = await withTenant(tenantId, async (tx) => ({
    week: await getHours(tx),
    reminder: await getReminderSettings(tx),
  }));
  const [wa, google, [salon]] = await Promise.all([
    whatsappState(tenantId),
    isGoogleConnected(tenantId),
    getDb()
      .select({ i: tenants.whatsappInstance, name: tenants.name, template: tenants.reminderTemplate })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  // WhatsApp conectado antes de existir o webhook: abrir Ajustes já liga as respostas
  const admin = adminFromEnv();
  if (wa === "open" && admin && salon?.i) await ensureWebhook(admin, salon.i).catch(() => undefined);
  return (
    <PageShell title="Ajustes">
      <section id="whatsapp" aria-label="WhatsApp" className="scroll-mt-6">
        <WhatsAppCard initial={wa} />
      </section>
      <section aria-label="Mensagem de confirmação" className="mt-6">
        <ReminderMessageForm initial={salon?.template ?? null} salonName={salon?.name ?? ""} />
      </section>
      <section id="google" aria-label="Google Agenda" className="mt-6 scroll-mt-6">
        <GoogleCard
          connected={google}
          failed={googleResult === "erro" || !!googleError}
          errorCode={typeof googleError === "string" ? googleError.slice(0, 60) : undefined}
        />
      </section>
      <section aria-label="Localização" className="mt-6">
        <LocationCard />
      </section>
      <section aria-label="Avisos" className="mt-6">
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </section>
      <section aria-label="Lembrete" className="mt-6">
        <ReminderForm settings={reminder} />
      </section>
      <section aria-label="Expediente" className="mt-6">
        <HoursForm week={week} />
      </section>
      <section aria-label="Atualização" className="mt-6">
        <UpdateButton />
      </section>
      <section aria-label="Tour e instalação" className="mt-6 grid gap-3">
        <InstallGuide />
        <ReplayTourButton />
      </section>
    </PageShell>
  );
}
