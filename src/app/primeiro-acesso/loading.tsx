import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

// A página lê sessão e banco; com cacheComponents, sem este limite de Suspense o build falha no prerender.
export default function Loading() {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label="Carregando o primeiro acesso">
        <Skeleton className="mb-4 mt-6 h-9 w-48" />
        <Skeleton className="mb-6 h-4 w-64" />
        {[52, 52, 52, 52, 52].map((h, i) => (
          <Skeleton key={i} className="mb-3 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
