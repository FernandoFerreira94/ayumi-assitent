import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getWalletSettings } from "@/features/wallet/core";
import { walletGuide } from "@/features/wallet/rules";
import { WalletRulesSheet } from "@/features/wallet/WalletRulesSheet";
import { WalletSettingsForm } from "@/features/wallet/WalletSettingsForm";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Pagamentos" };

/**
 * Ajustes > Pagamentos: regras do dinheiro da cliente (sinal, cancelamento, falta, validade do pacote e Pix).
 * Pacotes e promoções moram na página Planos; o link antigo (?aba=pacotes) leva para lá.
 */
export default async function PagamentosPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  if (aba === "pacotes") redirect("/planos?aba=pacotes");
  const { tenantId } = await requireTenant();
  const settings = await withTenant(tenantId, (tx) => getWalletSettings(tx));
  return (
    <PageShell back backHref="/ajustes" title="Pagamentos">
      <div className="-mt-1 mb-1 flex justify-end">
        <WalletRulesSheet guide={walletGuide(settings)} />
      </div>
      <Link
        href="/planos"
        className="glass mb-3 flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 font-bold"
      >
        <Icon name="ticket" size={20} />
        <span className="min-w-0 flex-1">
          Pacotes e promoções
          <span className="block text-sm font-semibold text-muted">Agora ficam em Planos, no menu</span>
        </span>
        <Icon name="arrowRight" size={18} />
      </Link>
      <section id="pagamentos" aria-label="Pagamentos das clientes">
        <WalletSettingsForm settings={settings} />
      </section>
    </PageShell>
  );
}
