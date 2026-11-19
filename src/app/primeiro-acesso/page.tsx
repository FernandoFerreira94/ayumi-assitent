import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { IphoneCalendarBody } from "@/features/settings/connection-bodies";
import { isGoogleCalendarConnected } from "@/features/google/server";
import { EntryFlow } from "@/features/onboarding/EntryFlow";
import { entryHours, onboardingPending } from "@/features/onboarding/server";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Primeiro acesso" };

/**
 * Entrada de primeiro acesso: Horários → Avisos → Agenda → Localização → Tudo pronto. Fica fora do layout do app
 * (sem barra de abas) e o layout do app manda para cá quem ainda não fez. `?etapa=agenda` é a volta do Google.
 */
export default async function PrimeiroAcessoPage({ searchParams }: PageProps<"/primeiro-acesso">) {
  const { userId, userName, tenantId } = await requireTenant();
  if (!(await onboardingPending(userId))) redirect("/agenda");
  const { etapa } = await searchParams;
  const [googleConnected, week, [salon]] = await Promise.all([
    isGoogleCalendarConnected(tenantId),
    entryHours(tenantId),
    getDb().select({ locationSource: tenants.locationSource }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  const backFromGoogle = etapa === "agenda";
  return (
    <EntryFlow
      firstName={userName.trim().split(/\s+/)[0] || "você"}
      initialWeek={week}
      googleConnected={googleConnected}
      locationOn={salon?.locationSource === "device"}
      publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      startAt={backFromGoogle ? "calendar" : "hours"}
      // Voltou do Google e a agenda não ficou ligada: erro do Google ou caixa da agenda desmarcada
      googleFailed={backFromGoogle && !googleConnected}
      iphoneCard={<IphoneCalendarBody tenantId={tenantId} google={googleConnected} />}
    />
  );
}
