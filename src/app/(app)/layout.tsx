import { Suspense } from "react";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { NavHistory } from "@/components/nav/BackButton";
import { FanNav } from "@/components/nav/FanNav";
import { QuickBook } from "@/features/appointments/QuickBook";
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
      <FanNav />
      <NavHistory />
      <Suspense fallback={null}>
        <QuickBook />
      </Suspense>
      <Suspense fallback={null}>
        <TourGate />
      </Suspense>
    </>
  );
}
