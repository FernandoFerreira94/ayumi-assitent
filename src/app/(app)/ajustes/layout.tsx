import { headers } from "next/headers";
import { userAgent } from "next/server";
import { SettingsNav } from "@/features/settings/SettingsNav";
import { loadSettingsSummary } from "@/features/settings/summary";
import { requireTenant } from "@/lib/tenant";

/**
 * Desktop: lista das seções à esquerda e a seção aberta à direita (como os Ajustes do Mac).
 * Celular não consulta nem monta a coluna: continua lista → seção, como no iPhone.
 */
export default async function AjustesLayout({ children }: LayoutProps<"/ajustes">) {
  const desk = userAgent({ headers: await headers() }).device.type !== "mobile";
  if (!desk) return children;
  const { tenantId } = await requireTenant();
  const groups = await loadSettingsSummary(tenantId);
  return (
    <div className="lg:flex lg:items-start">
      <SettingsNav groups={groups} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
