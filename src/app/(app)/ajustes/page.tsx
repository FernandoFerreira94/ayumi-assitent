import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { InstallGuide } from "@/features/install/InstallGuide";
import { LegacyHashRedirect } from "@/features/settings/LegacyHashRedirect";
import { SettingsGroup, SettingsRow } from "@/features/settings/SettingsList";
import { loadSettingsSummary } from "@/features/settings/summary";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { UpdateButton } from "@/features/update/UpdateButton";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Ajustes" };

/**
 * Ajustes é a lista de partida, como os Ajustes do iPhone: cada linha diz o estado e abre a sua seção.
 * Aqui só se lê o resumo; o que cada seção edita (e carrega) fica na tela dela.
 * Desktop: lista à esquerda e "Este aparelho" à direita; dentro das seções a lista vira a coluna lateral.
 */
export default async function AjustesPage() {
  const { tenantId } = await requireTenant();
  const groups = await loadSettingsSummary(tenantId);

  return (
    <PageShell title="Ajustes" wide>
      <LegacyHashRedirect />
      <div className="md:mx-auto md:max-w-[720px] lg:mx-0 lg:grid lg:max-w-[1100px] lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div>
          {groups.map((g) => (
            <SettingsGroup key={g.title} title={g.title}>
              {g.lines.map((l) => (
                <SettingsRow key={l.section} section={l.section} status={l.status} todo={l.todo} />
              ))}
            </SettingsGroup>
          ))}
        </div>
        <div className="mt-7 grid gap-3 lg:mt-0">
          <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted">Este aparelho</h2>
          <UpdateButton />
          <InstallGuide />
          <ReplayTourButton />
        </div>
      </div>
    </PageShell>
  );
}
