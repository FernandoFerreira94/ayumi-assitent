import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getWalletSettings } from "@/features/wallet/core";
import { WalletSettingsForm } from "@/features/wallet/WalletSettingsForm";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Pagamentos" };

/** Ajustes > Pagamentos: regras do dinheiro da cliente (sinal, cancelamento, falta, pacotes e Pix). */
export default async function PagamentosPage() {
  const { tenantId } = await requireTenant();
  const settings = await withTenant(tenantId, (tx) => getWalletSettings(tx));
  return (
    <PageShell back backHref="/ajustes" title="Pagamentos">
      <section id="pagamentos" aria-label="Pagamentos das clientes" className="scroll-mt-6">
        <WalletSettingsForm settings={settings} />
      </section>
    </PageShell>
  );
}
