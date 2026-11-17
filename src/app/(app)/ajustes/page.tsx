import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { calendarSettings } from "@/features/calendar-feed/server";
import { getHours } from "@/features/hours/core";
import { InstallGuide } from "@/features/install/InstallGuide";
import { getReminderSettings } from "@/features/reminders/core";
import { LegacyHashRedirect } from "@/features/settings/LegacyHashRedirect";
import { PushStatusText } from "@/features/settings/PushStatusText";
import { hoursSummary } from "@/features/settings/sections";
import { SettingsGroup, SettingsRow } from "@/features/settings/SettingsList";
import { shellStatus } from "@/features/shell/status";
import { listProfessionals } from "@/features/team/core";
import { canAs, ownAgendaId } from "@/features/team/permissions";
import { calendarProfessionalId } from "@/features/team/professional";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { UpdateButton } from "@/features/update/UpdateButton";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Ajustes" };

/**
 * Ajustes é a lista de partida, como os Ajustes do iPhone: cada linha diz o estado e abre a sua seção.
 * Aqui só se lê o resumo; o que cada seção edita (e carrega) fica na tela dela.
 */
export default async function AjustesPage() {
  const me = await requireTenant();
  const { tenantId, professionalId } = me;
  const manager = canAs(me, "team.manage");
  const [{ whatsapp, google }, { week, reminders, team }, calendar] = await Promise.all([
    shellStatus(tenantId, professionalId),
    withTenant(tenantId, async (tx) => ({ week: await getHours(tx, ownAgendaId(me)), reminders: await getReminderSettings(tx),
      team: manager ? (await listProfessionals(tx)).filter((p) => p.active).length : 0,
    })),
    calendarProfessionalId({ tenantId, professionalId }).then((id) => calendarSettings(tenantId, id)),
  ]);
  const iphone = calendar.feedOn || calendar.icloudOn;
  const calendars = [google ? "Google conectado" : null, iphone ? "iPhone ligado" : null].filter(Boolean);
  const avisos = [
    reminders.first ? `1º aviso ${reminders.hours}h antes` : null,
    reminders.secondHours ? `2º aviso ${reminders.secondHours}h antes` : null,
  ].filter(Boolean);

  return (
    <PageShell title="Ajustes">
      <LegacyHashRedirect />
      <SettingsGroup title="Conexões">
        {manager ? (
          <SettingsRow
            section="whatsapp"
            status={
              whatsapp === "open" ? "Conectado" : whatsapp === "unavailable" ? "Sem resposta agora" : "Desconectado"
            }
            todo={whatsapp === "other" ? "Conectar" : undefined}
          />
        ) : null}
        <SettingsRow
          section="calendarios"
          status={calendars.length ? calendars.join(" · ") : "Google e iPhone"}
          todo={calendars.length ? undefined : "Configurar"}
        />
        <SettingsRow section="notificacoes" status={<PushStatusText />} />
      </SettingsGroup>
      <SettingsGroup title="Clientes e agenda">
        {manager ? (
          <SettingsRow section="mensagens" status={avisos.length ? avisos.join(" · ") : "Avisos desligados"} />
        ) : null}
        <SettingsRow section="expediente" status={hoursSummary(week)} />
        {manager ? (
          <SettingsRow section="equipe" status={team === 1 ? "1 profissional" : `${team} profissionais`} />
        ) : null}
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
