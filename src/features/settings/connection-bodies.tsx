import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { AtalhosCard } from "@/features/atalhos/AtalhosCard";
import { listApiTokens } from "@/features/atalhos/server";
import { IphoneCalendarCard } from "@/features/calendar-feed/IphoneCalendarCard";
import { GoogleCard } from "@/features/google/GoogleCard";
import { isGoogleConnected } from "@/features/google/server";
import { LocationToggle } from "@/features/owner-notices/LocationToggle";
import { PushToggle } from "@/features/push/PushToggle";
import { shellStatus } from "@/features/shell/status";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { maskPhone } from "@/lib/phone";
import { getSession } from "@/lib/session";

/**
 * Miolo de cada conexão de Ajustes. O mesmo cartão aparece na tela da seção (`/ajustes/whatsapp`…) e dentro do
 * acordeão de Conexões na lista: um lugar só, sem duas versões do fluxo de conectar.
 */

export async function WhatsAppBody({ tenantId }: { tenantId: string }) {
  const [{ whatsapp }, [t]] = await Promise.all([
    shellStatus(tenantId),
    getDb().select({ phone: tenants.businessPhone }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  // Telefone do Meu perfil (E.164) vem como sugestão no campo do número ao conectar
  const profilePhone = t?.phone ? maskPhone(t.phone.replace(/^\+55/, "")) : "";
  return (
    <section id="whatsapp" aria-label="WhatsApp" className="scroll-mt-6">
      <WhatsAppCard initial={whatsapp} profilePhone={profilePhone} />
    </section>
  );
}

export async function CalendarsBody({
  tenantId,
  googleResult,
  googleError,
}: {
  tenantId: string;
  googleResult?: unknown;
  googleError?: unknown;
}) {
  const [google, [salon], session] = await Promise.all([
    isGoogleConnected(tenantId),
    getDb()
      .select({
        calendarOn: tenants.calendarTokenHash,
        calendarHideNames: tenants.calendarHideNames,
        calendarFetchedAt: tenants.calendarFetchedAt,
        icloudOn: tenants.icloudCalendarUrl,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
    getSession(),
  ]);
  return (
    <>
      <section id="google" aria-label="Google Agenda" className="scroll-mt-6">
        <GoogleCard
          connected={google}
          failed={googleResult === "erro" || !!googleError}
          errorCode={typeof googleError === "string" ? googleError.slice(0, 60) : undefined}
          email={session?.user.email}
        />
      </section>
      <section id="iphone" aria-label="Calendário do iPhone" className="scroll-mt-6">
        <IphoneCalendarCard
          enabled={!!salon?.calendarOn}
          hideNames={salon?.calendarHideNames ?? false}
          subscribed={!!salon?.calendarOn && !!salon.calendarFetchedAt}
          googleConnected={google}
          icloudOn={!!salon?.icloudOn}
        />
      </section>
    </>
  );
}

export async function NotificationsBody({ tenantId }: { tenantId: string }) {
  const [salon] = await getDb()
    .select({ city: tenants.city, state: tenants.state, locationSource: tenants.locationSource })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return (
    <>
      <section id="avisos-celular" aria-label="Notificação" className="scroll-mt-6">
        <PushToggle
          publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
          nativeReady={{
            android: !!process.env.FCM_SERVICE_ACCOUNT,
            ios: !!(process.env.APNS_KEY && process.env.APNS_KEY_ID && process.env.APPLE_TEAM_ID),
          }}
        />
      </section>
      <section id="localizacao" aria-label="Localização" className="scroll-mt-6">
        <LocationToggle
          source={salon?.locationSource ?? null}
          city={salon?.city ?? null}
          state={salon?.state ?? null}
        />
      </section>
    </>
  );
}

async function baseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

export async function SiriBody({ tenantId }: { tenantId: string }) {
  const [tokens, base] = await Promise.all([listApiTokens(tenantId), baseUrl()]);
  return (
    <section id="siri" aria-label="Siri e Atalhos" className="scroll-mt-6">
      <AtalhosCard initial={tokens} baseUrl={base} />
    </section>
  );
}
