import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { IphoneCalendarCard } from "@/features/calendar-feed/IphoneCalendarCard";
import { calendarSettings } from "@/features/calendar-feed/server";
import { GoogleCard } from "@/features/google/GoogleCard";
import { isGoogleConnected } from "@/features/google/server";
import { calendarProfessionalId } from "@/features/team/professional";
import { getSession } from "@/lib/session";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Calendários" };

/** Ajustes > Calendários: Google Agenda e Calendário do iPhone (ida pelo link webcal, volta pelo iCloud). */
export default async function CalendariosPage({ searchParams }: PageProps<"/ajustes/calendarios">) {
  const me = await requireTenant();
  const { google: googleResult, error: googleError } = await searchParams;
  // Os calendários são da profissional do login (owner/admin sem ligação: a padrão do salão)
  const professionalId = await calendarProfessionalId(me);
  const [google, salon, session] = await Promise.all([
    isGoogleConnected(professionalId),
    calendarSettings(me.tenantId, professionalId),
    getSession(),
  ]);
  return (
    <PageShell back backHref="/ajustes" title="Calendários">
      <div className="grid gap-3">
        <section id="google" aria-label="Google Agenda" className="scroll-mt-6">
          <GoogleCard
            connected={google}
            failed={googleResult === "erro" || !!googleError}
            errorCode={typeof googleError === "string" ? googleError.slice(0, 60) : undefined}
            email={session?.user.email}
          />
        </section>
        <section id="iphone" aria-label="Calendário do iPhone" className="scroll-mt-6">
          <IphoneCalendarCard
            enabled={salon.feedOn}
            hideNames={salon.hideNames}
            googleConnected={google}
            icloudOn={salon.icloudOn}
          />
        </section>
      </div>
    </PageShell>
  );
}
