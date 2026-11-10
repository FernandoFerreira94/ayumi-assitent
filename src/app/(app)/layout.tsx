import { Suspense } from "react";
import { sql } from "drizzle-orm";
import { MascotSync } from "@/components/brand/MascotSync";
import { DEFAULT_MASCOT, isMascotKind } from "@/components/brand/mascots";
import { getDb } from "@/db/client";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { NavHistory } from "@/components/nav/BackButton";
import { TabBar } from "@/components/nav/TabBar";
import { QuickBook } from "@/features/appointments/QuickBook";
import { ConversationHost } from "@/features/messaging/ConversationHost";
import { NoticeHost } from "@/features/owner-notices/NoticeHost";
import { TourGate } from "@/features/tour/TourGate";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { requireSession } from "@/lib/session";

// Valida a sessão no servidor sem bloquear o shell (dock e faixa offline ficam estáticos).
// Aproveita para alinhar o mascote/cores do aparelho com o escolhido em Meu perfil.
async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const rows = await getDb().execute<{ mascot: string }>(
    sql`select mascot from memberships where user_id = ${session.user.id} limit 1`,
  );
  const mascot = rows[0]?.mascot;
  return (
    <>
      <MascotSync value={isMascotKind(mascot) ? mascot : DEFAULT_MASCOT} />
      {children}
    </>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <OfflineBanner />
      <Suspense
        fallback={
          <LoadingRegion label="Verificando seu acesso">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
          </LoadingRegion>
        }
      >
        <AuthGate>{children}</AuthGate>
      </Suspense>
      <TabBar />
      <NavHistory />
      <Suspense fallback={null}>
        <QuickBook />
      </Suspense>
      <Suspense fallback={null}>
        <TourGate />
      </Suspense>
      {/* ?conversa=<cliente>: notificação e sino abrem a conversa por cima da tela atual */}
      <Suspense fallback={null}>
        <ConversationHost />
      </Suspense>
      {/* ?aviso=<id>: roteiro da semana e mensagem pronta das datas comemorativas */}
      <Suspense fallback={null}>
        <NoticeHost />
      </Suspense>
    </>
  );
}
