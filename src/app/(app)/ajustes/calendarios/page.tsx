import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { CalendarsBody } from "@/features/settings/connection-bodies";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Calendários" };

/** Ajustes > Calendários: Google Agenda e Calendário do iPhone (ida pelo link webcal, volta pelo iCloud). */
export default async function CalendariosPage({ searchParams }: PageProps<"/ajustes/calendarios">) {
  const { tenantId } = await requireTenant();
  const { google, error } = await searchParams;
  return (
    <PageShell back backHref="/ajustes" title="Calendários">
      <div className="grid gap-3">
        <CalendarsBody tenantId={tenantId} googleResult={google} googleError={error} />
      </div>
    </PageShell>
  );
}
