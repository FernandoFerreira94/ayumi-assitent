import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

// Painel do dono: fora do grupo (app) (sem casca do salão). Nada aqui consulta banco nem mostra o menu:
// o guard (requireAdmin) roda em cada página e só depois dele o menu aparece. Quem não é admin vê 404.
export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Bubbly Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div data-mascot="bolha">
      <Suspense
        fallback={
          <LoadingRegion label="Carregando">
            <div className="mx-auto grid max-w-md gap-3 px-6 pt-24">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-40 w-full" />
            </div>
          </LoadingRegion>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
