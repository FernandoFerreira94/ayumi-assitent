import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { GoogleCard } from "@/features/google/GoogleCard";
import { isGoogleConnected } from "@/features/google/server";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { getReminderHours } from "@/features/reminders/core";
import { ReminderForm } from "@/features/reminders/ReminderForm";
import { PushToggle } from "@/features/push/PushToggle";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { listServices } from "@/features/services/core";
import { InstallGuide } from "@/features/install/InstallGuide";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { SalonForm } from "@/features/salon/SalonForm";
import type { BusinessType } from "@/features/salon/schema";
import { ensureWebhook } from "@/features/whatsapp/webhook";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { LocationCard } from "@/features/weather/LocationCard";
import { requireTenant } from "@/lib/tenant";
import { whatsappState } from "@/features/shell/status";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage({ searchParams }: PageProps<"/ajustes">) {
  const { tenantId } = await requireTenant();
  const { google: googleResult } = await searchParams;
  const { services, week, reminderHours } = await withTenant(tenantId, async (tx) => ({
    services: await listServices(tx),
    week: await getHours(tx),
    reminderHours: await getReminderHours(tx),
  }));
  const [wa, google, [salon]] = await Promise.all([
    whatsappState(tenantId),
    isGoogleConnected(tenantId),
    getDb()
      .select({ name: tenants.name, businessType: tenants.businessType, reminderTemplate: tenants.reminderTemplate, i: tenants.whatsappInstance })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  // WhatsApp conectado antes de existir o webhook: abrir Ajustes já liga as respostas
  const admin = adminFromEnv();
  if (wa === "open" && admin && salon?.i) await ensureWebhook(admin, salon.i).catch(() => undefined);
  return (
    <PageShell title="Ajustes">
      <section aria-label="Seu salão" className="mb-6">
        <SalonForm
          initial={{
            name: salon?.name ?? "",
            businessType: (salon?.businessType as BusinessType | null) ?? null,
            reminderTemplate: salon?.reminderTemplate ?? null,
          }}
        />
      </section>
      {/* Serviços ganharam tela própria; aqui fica só o atalho */}
      <Link href="/servicos" className="glass flex min-h-13 items-center justify-between gap-3 rounded-full px-5 py-3.5">
        <span className="font-bold">Serviços</span>
        <span className="text-sm font-semibold text-muted">
          {services.length === 0 ? "Cadastrar o primeiro" : `${services.length} ${services.length === 1 ? "cadastrado" : "cadastrados"}`} ›
        </span>
      </Link>
      <section id="whatsapp" aria-label="WhatsApp" className="mt-6 scroll-mt-6">
        <WhatsAppCard initial={wa} />
      </section>
      <section id="google" aria-label="Google Agenda" className="mt-6 scroll-mt-6">
        <GoogleCard connected={google} failed={googleResult === "erro"} />
      </section>
      <section aria-label="Localização" className="mt-6">
        <LocationCard />
      </section>
      <section aria-label="Avisos" className="mt-6">
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </section>
      <section aria-label="Lembrete" className="mt-6">
        <ReminderForm hours={reminderHours} />
      </section>
      <section aria-label="Expediente" className="mt-6">
        <HoursForm week={week} />
      </section>
      <section aria-label="Tour e instalação" className="mt-6 grid gap-3">
        <InstallGuide />
        <ReplayTourButton />
      </section>
    </PageShell>
  );
}
