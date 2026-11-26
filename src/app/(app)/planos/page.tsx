import type { Metadata } from "next";
import { and, asc, eq, isNull } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { clients, services, tenants } from "@/db/schema";
import { getWalletSettings } from "@/features/wallet/core";
import { DiscountPromos } from "@/features/wallet/DiscountPromos";
import { PackageTemplates } from "@/features/wallet/PackageSheets";
import { listSoldPackages, listTemplates } from "@/features/wallet/packages";
import { groupSold, planTotals } from "@/features/wallet/plan-views";
import { PlansSetup } from "@/features/wallet/PlansSetup";
import { PlansTabs, type PlansTab } from "@/features/wallet/PlansTabs";
import { listPromotions } from "@/features/wallet/promotions";
import { walletGuide } from "@/features/wallet/rules";
import { SellFromPlans, SoldPackages, type SoldItem } from "@/features/wallet/SoldPackages";
import { promotionView, templateView } from "@/features/wallet/views";
import { WalletRulesSheet } from "@/features/wallet/WalletRulesSheet";
import { formatShortDate, formatTime, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Planos" };

const TAB: Record<string, PlansTab> = { pacotes: "pacotes", promocoes: "promocoes" };

/**
 * Planos: tudo de pacote e promoção num lugar só. Topo com os números; abas Clientes (pacote de cada cliente com
 * sessões usadas e restantes), Pacotes (modelos à venda) e Promoções (desconto no agendamento). Ações em folhas.
 */
export default async function PlanosPage({ searchParams }: PageProps<"/planos">) {
  const { aba } = await searchParams;
  const { tenantId } = await requireTenant();
  const today = todayStr();
  const data = await withTenant(tenantId, async (tx) => ({
    settings: await getWalletSettings(tx),
    promos: await listPromotions(tx),
    templates: await listTemplates(tx),
    sold: await listSoldPackages(tx),
    salon: (
      await tx
        .select({ name: tenants.name, address: tenants.address, instagram: tenants.instagram })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
    )[0] ?? { name: "", address: null, instagram: null },
    svcs: await tx
      .select({ id: services.id, name: services.name, priceCents: services.priceCents })
      .from(services)
      .where(and(eq(services.active, true), eq(services.bookable, true)))
      .orderBy(asc(services.position), asc(services.name)),
    people: await tx
      .select({ id: clients.id, label: clients.name })
      .from(clients)
      .where(isNull(clients.anonymizedAt))
      .orderBy(asc(clients.name)),
  }));
  const days = data.settings.packageValidDays;
  const templates = data.templates.map((t) => templateView(t, days, today));
  const promotions = data.promos.map((p) => promotionView(p, today));
  const totals = planTotals(data.sold, templates, promotions, today);
  const groups = groupSold(
    data.sold.map(
      (p): Omit<SoldItem, "state"> => ({
        id: p.id,
        clientId: p.clientId,
        clientName: p.clientName,
        name: p.name,
        sessionsTotal: p.sessionsTotal,
        expiresOn: p.expiresOn,
        left: p.left,
        next: p.nextAt ? `${formatShortDate(todayStr(p.nextAt))} às ${formatTime(p.nextAt)}` : null,
      }),
    ),
    today,
  );
  const stats = [
    { n: totals.clients, label: totals.clients === 1 ? "cliente com pacote" : "clientes com pacote" },
    { n: totals.sessions, label: totals.sessions === 1 ? "sessão a usar" : "sessões a usar" },
    { n: totals.forSale, label: totals.forSale === 1 ? "pacote à venda" : "pacotes à venda" },
    { n: totals.promotions, label: totals.promotions === 1 ? "promoção valendo" : "promoções valendo" },
  ];

  // Sem serviço não há pacote nem promoção para montar: a página vira só o aviso com o botão de cadastrar
  if (data.svcs.length === 0)
    return (
      <PageShell title="Planos" wide>
        <PlansSetup missing="service" />
      </PageShell>
    );

  return (
    <PageShell title="Planos" wide>
      <section aria-label="Resumo dos planos" className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass grid gap-0.5 rounded-3xl px-4 py-3">
            <b className="text-3xl tabular-nums tracking-tight text-primary-text">{s.n}</b>
            <span className="text-sm font-bold text-muted">{s.label}</span>
          </div>
        ))}
      </section>
      {data.people.length === 0 ? <PlansSetup missing="client" /> : null}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {data.people.length ? <SellFromPlans clients={data.people} /> : <span />}
        <WalletRulesSheet guide={walletGuide(data.settings)} />
      </div>
      <PlansTabs
        initial={TAB[typeof aba === "string" ? aba : ""] ?? "clientes"}
        panels={{
          clientes: <SoldPackages current={groups.current} past={groups.past} />,
          pacotes: (
            <section id="pacotes" aria-label="Pacotes à venda">
              <PackageTemplates templates={templates} services={data.svcs} validDays={days} salon={data.salon} />
            </section>
          ),
          promocoes: (
            <section id="promocoes" aria-label="Promoções de desconto">
              <DiscountPromos promotions={promotions} services={data.svcs} salon={data.salon} />
            </section>
          ),
        }}
      />
    </PageShell>
  );
}
