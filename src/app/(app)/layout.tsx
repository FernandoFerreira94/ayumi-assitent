import { Suspense } from "react";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { FanNav } from "@/components/nav/FanNav";
import { NavSwitch } from "@/components/nav/NavSwitch";
import { QuickBook } from "@/features/appointments/QuickBook";
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
      {/* useSearchParams precisa de Suspense para o shell continuar estático */}
      <Suspense fallback={<FanNav />}>
        <NavSwitch />
      </Suspense>
      <Suspense fallback={null}>
        <QuickBook />
      </Suspense>
    </>
  );
}
