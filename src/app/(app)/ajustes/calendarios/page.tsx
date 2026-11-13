import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { IphoneCalendarCard } from "@/features/calendar-feed/IphoneCalendarCard";
import { GoogleCard } from "@/features/google/GoogleCard";
import { isGoogleConnected } from "@/features/google/server";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Calendários" };

/** Ajustes > Calendários: Google Agenda e Calendário do iPhone (ida pelo link webcal, volta pelo iCloud). */
export default async function CalendariosPage({ searchParams }: PageProps<"/ajustes/calendarios">) {
  const { tenantId } = await requireTenant();
  const { google: googleResult, error: googleError } = await searchParams;
  const [google, [salon]] = await Promise.all([
    isGoogleConnected(tenantId),
    getDb()
      .select({
        calendarOn: tenants.calendarTokenHash,
        calendarHideNames: tenants.calendarHideNames,
        icloudOn: tenants.icloudCalendarUrl,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  return (
    <PageShell back backHref="/ajustes" title="Calendários">
      <div className="grid gap-3">
        <section id="google" aria-label="Google Agenda" className="scroll-mt-6">
          <GoogleCard
            connected={google}
            failed={googleResult === "erro" || !!googleError}
            errorCode={typeof googleError === "string" ? googleError.slice(0, 60) : undefined}
          />
        </section>
        <section id="iphone" aria-label="Calendário do iPhone" className="scroll-mt-6">
          <IphoneCalendarCard
            enabled={!!salon?.calendarOn}
            hideNames={salon?.calendarHideNames ?? false}
            googleConnected={google}
            icloudOn={!!salon?.icloudOn}
          />
        </section>
      </div>
    </PageShell>
  );
}
