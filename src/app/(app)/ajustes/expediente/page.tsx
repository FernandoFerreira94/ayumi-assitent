import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { ownAgendaId } from "@/features/team/permissions";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Expediente" };

/** Ajustes > Expediente: dias, horários e pausa. A agenda e as vagas seguem daqui. */
export default async function ExpedientePage() {
  const me = await requireTenant();
  const week = await withTenant(me.tenantId, (tx) => getHours(tx, ownAgendaId(me)));
  return (
    <PageShell back backHref="/ajustes" title="Expediente">
      <section id="expediente" aria-label="Expediente" className="scroll-mt-6">
        <HoursForm week={week} />
      </section>
    </PageShell>
  );
}
