import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { getHours } from "@/features/hours/core";
import { InstallGuide } from "@/features/install/InstallGuide";
import { getReminderSettings } from "@/features/reminders/core";
import { LegacyHashRedirect } from "@/features/settings/LegacyHashRedirect";
import { PushStatusText } from "@/features/settings/PushStatusText";
import { hoursSummary } from "@/features/settings/sections";
import { SettingsGroup, SettingsRow } from "@/features/settings/SettingsList";
import { shellStatus } from "@/features/shell/status";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { UpdateButton } from "@/features/update/UpdateButton";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Ajustes" };

/**
 * Ajustes é a lista de partida, como os Ajustes do iPhone: cada linha diz o estado e abre a sua seção.
 * Aqui só se lê o resumo; o que cada seção edita (e carrega) fica na tela dela.
 */
export default async function AjustesPage() {
  const { tenantId } = await requireTenant();
  const [{ whatsapp, google }, { week, reminders }, [salon]] = await Promise.all([
    shellStatus(tenantId),
    withTenant(tenantId, async (tx) => ({ week: await getHours(tx), reminders: await getReminderSettings(tx) })),
    getDb()
      .select({ calendarOn: tenants.calendarTokenHash, icloudOn: tenants.icloudCalendarUrl })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  const iphone = !!salon?.calendarOn || !!salon?.icloudOn;
  const calendars = [google ? "Google conectado" : null, iphone ? "iPhone ligado" : null].filter(Boolean);
  const avisos = [
    reminders.first ? `1º aviso ${reminders.hours}h antes` : null,
    reminders.secondHours ? `2º aviso ${reminders.secondHours}h antes` : null,
  ].filter(Boolean);

  return (
    <PageShell title="Ajustes">
      <LegacyHashRedirect />
      <SettingsGroup title="Conexões">
        <SettingsRow
          section="whatsapp"
          status={
            whatsapp === "open" ? "Conectado" : whatsapp === "unavailable" ? "Sem resposta agora" : "Desconectado"
          }
          todo={whatsapp === "other" ? "Conectar" : undefined}
        />
        <SettingsRow
          section="calendarios"
          status={calendars.length ? calendars.join(" · ") : "Google e iPhone"}
          todo={calendars.length ? undefined : "Configurar"}
        />
        <SettingsRow section="notificacoes" status={<PushStatusText />} />
      </SettingsGroup>
      <SettingsGroup title="Clientes e agenda">
        <SettingsRow
          section="mensagens"
          status={avisos.length ? avisos.join(" · ") : "Avisos desligados"}
        />
        <SettingsRow section="expediente" status={hoursSummary(week)} />
      </SettingsGroup>
      <div className="mt-7 grid gap-3">
        <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted">Este aparelho</h2>
        <UpdateButton />
        <InstallGuide />
        <ReplayTourButton />
      </div>
    </PageShell>
  );
}
