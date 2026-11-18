import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageShell } from "@/components/ui/PageShell";
import { AtalhosCard } from "@/features/atalhos/AtalhosCard";
import { listApiTokens } from "@/features/atalhos/server";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Siri e Atalhos" };

async function baseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

/** Ajustes > Siri e Atalhos: chave só de leitura para consultar a agenda pela Siri. */
export default async function SiriPage() {
  const { tenantId } = await requireTenant();
  const [tokens, base] = await Promise.all([listApiTokens(tenantId), baseUrl()]);
  return (
    <PageShell back backHref="/ajustes" title="Siri e Atalhos">
      <section id="siri" aria-label="Siri e Atalhos" className="scroll-mt-6">
        <AtalhosCard initial={tokens} baseUrl={base} />
      </section>
    </PageShell>
  );
}
