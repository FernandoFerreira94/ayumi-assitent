import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { MascotPicker } from "@/features/salon/MascotPicker";
import { SalonForm } from "@/features/salon/SalonForm";
import { phoneFromWhatsapp, type Segment } from "@/features/salon/schema";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Meu perfil" };

/** Número do WhatsApp conectado, para sugerir no telefone comercial. Sem conexão ou lento = sem sugestão. */
async function whatsappPhone(instance: string | null): Promise<string | null> {
  const admin = adminFromEnv();
  if (!admin || !instance) return null;
  try {
    const n = await Promise.race([
      admin.number(instance),
      new Promise<null>((r) => setTimeout(() => r(null), 2500)),
    ]);
    return phoneFromWhatsapp(n);
  } catch {
    return null;
  }
}

export default async function PerfilPage() {
  const { tenantId } = await requireTenant();
  const [t] = await getDb()
    .select({
      name: tenants.name,
      ownerName: tenants.ownerName,
      businessPhone: tenants.businessPhone,
      instance: tenants.whatsappInstance,
      segments: tenants.segments,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  // Ainda sem telefone salvo: já vem o do WhatsApp conectado (editável)
  const phone = t?.businessPhone ?? (await whatsappPhone(t?.instance ?? null));
  return (
    <PageShell back title="Meu perfil">
      <div className="grid gap-6">
        <MascotPicker />
        <SalonForm
          initial={{
            name: t?.name ?? "",
            ownerName: t?.ownerName ?? "",
            businessPhone: phone ? maskPhone(phone.replace(/^\+55/, "")) : "",
            phoneFromWhatsapp: !t?.businessPhone && !!phone,
            segments: (t?.segments ?? []) as Segment[],
          }}
        />
      </div>
    </PageShell>
  );
}
