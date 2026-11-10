import { Suspense } from "react";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { NavHistory } from "@/components/nav/BackButton";
import { TabBar } from "@/components/nav/TabBar";
import { QuickBook } from "@/features/appointments/QuickBook";
import { ConversationHost } from "@/features/messaging/ConversationHost";
import { TourGate } from "@/features/tour/TourGate";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { requireSession } from "@/lib/session";

// Valida a sessão no servidor sem bloquear o shell (dock e faixa offline ficam estáticos).
async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireSession();
  return children;
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
    </>
  );
}
