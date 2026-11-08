import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { isGoogleConnected } from "@/features/google/server";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { buildAvisos } from "@/features/notifications/core";
import { currentState } from "@/features/whatsapp/core";
import { requireTenant } from "@/lib/tenant";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Notificações" };

async function whatsappState(tenantId: string): Promise<"open" | "other" | "unavailable"> {
  const admin = adminFromEnv();
  if (!admin) return "unavailable";
  try {
    const [t] = await getDb().select({ i: tenants.whatsappInstance }).from(tenants).where(eq(tenants.id, tenantId));
    return (await currentState(admin, t?.i ?? null)) === "open" ? "open" : "other";
  } catch {
    return "unavailable";
  }
}

export default async function AvisosPage() {
  await connection();
  const { tenantId } = await requireTenant();
  const [google, whatsapp] = await Promise.all([isGoogleConnected(tenantId), whatsappState(tenantId)]);
  const avisos = buildAvisos({ whatsapp, google });

  return (
    <PageShell title="Notificações">
      <section aria-labelledby="avisos" className="grid gap-2">
        <h2 id="avisos" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
          Avisos
        </h2>
        {avisos.length === 0 ? (
          <EmptyState title="Sem avisos" description="WhatsApp e Google Agenda estão conectados." />
        ) : (
          <ul className="grid gap-2">
            {avisos.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="glass block rounded-2xl px-4 py-3">
                  <span className="block font-bold">{a.title}</span>
                  <span className="block text-sm font-semibold text-muted">{a.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
