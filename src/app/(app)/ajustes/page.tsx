import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { InstallGuide } from "@/features/install/InstallGuide";
import { CalendarsBody, NotificationsBody, WhatsAppBody } from "@/features/settings/connection-bodies";
import { ConnectionsAccordion } from "@/features/settings/ConnectionsAccordion";
import { LegacyHashRedirect } from "@/features/settings/LegacyHashRedirect";
import { SettingsGroup, SettingsRow } from "@/features/settings/SettingsList";
import { loadSettingsSummary } from "@/features/settings/summary";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { UpdateButton } from "@/features/update/UpdateButton";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Ajustes" };

/**
 * Ajustes é a lista de partida, como os Ajustes do iPhone: cada linha diz o estado e abre a sua seção.
 * Conexões (WhatsApp, Calendários, Notificações) abrem em acordeão ali mesmo, com selo de estado; as outras
 * linhas abrem a tela da seção.
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
          {groups.map((g) =>
            g.title === "Conexões" ? (
              <ConnectionsAccordion
                key={g.title}
                title={g.title}
                lines={g.lines}
                bodies={{
                  whatsapp: <WhatsAppBody tenantId={tenantId} />,
                  calendarios: <CalendarsBody tenantId={tenantId} />,
                  notificacoes: <NotificationsBody tenantId={tenantId} />,
                }}
              />
            ) : (
              <SettingsGroup key={g.title} title={g.title}>
                {g.lines.map((l) => (
                  <SettingsRow key={l.section} section={l.section} status={l.status} todo={l.todo} />
                ))}
              </SettingsGroup>
            ),
          )}
        </div>
        <div className="mt-7 grid gap-3 lg:mt-0">
          <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted">Este aparelho</h2>
          <UpdateButton />
          <InstallGuide />
          <ReplayTourButton />
          {/* Mesmo rodapé do login; abre o site público em outra aba para não sair do app. */}
          <nav
            aria-label="Documentos legais"
            className="flex justify-center gap-5 pt-2 text-xs font-semibold text-muted"
          >
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center">
              Política de privacidade
            </a>
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center">
              Termos
            </a>
          </nav>
        </div>
      </div>
    </PageShell>
  );
}
