import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getWalletSettings } from "@/features/wallet/core";
import { WalletSettingsForm } from "@/features/wallet/WalletSettingsForm";
import { requireTenant } from "@/lib/tenant";
import { and, asc, eq } from "drizzle-orm";
import { services } from "@/db/schema";
import { listTemplates } from "@/features/wallet/packages";
import { PackageTemplates } from "@/features/wallet/PackageSheets";
import { templateView } from "@/features/wallet/views";
import { todayStr } from "@/lib/dates";
import { walletGuide } from "@/features/wallet/rules";
import { WalletRulesSheet } from "@/features/wallet/WalletRulesSheet";
import { PaymentsTabs } from "@/features/wallet/PaymentsTabs";

export const metadata: Metadata = { title: "Pagamentos" };

/** Ajustes > Pagamentos: regras do dinheiro da cliente (sinal, cancelamento, falta, pacotes e Pix). */
export default async function PagamentosPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const { tenantId } = await requireTenant();
  const { settings, templates, svcs } = await withTenant(tenantId, async (tx) => ({
    settings: await getWalletSettings(tx),
    templates: await listTemplates(tx),
    svcs: await tx
      .select({ id: services.id, name: services.name, priceCents: services.priceCents })
      .from(services)
      .where(and(eq(services.active, true), eq(services.bookable, true)))
      .orderBy(asc(services.position), asc(services.name)),
  }));
  const days = settings.packageValidDays;
  const today = todayStr();
  const views = templates.map((t) => templateView(t, days, today));
  return (
    <PageShell back backHref="/ajustes" title="Pagamentos">
      <div className="-mt-1 mb-1 flex justify-end">
        <WalletRulesSheet guide={walletGuide(settings)} />
      </div>
      <PaymentsTabs
        initial={aba === "pacotes" ? "packages" : "rules"}
        rules={
          <section id="pagamentos" aria-label="Pagamentos das clientes">
            <WalletSettingsForm settings={settings} />
          </section>
        }
        packages={
          <section id="pacotes" aria-label="Pacotes à venda">
            <PackageTemplates templates={views} services={svcs} validDays={days} />
          </section>
        }
      />
    </PageShell>
  );
}
