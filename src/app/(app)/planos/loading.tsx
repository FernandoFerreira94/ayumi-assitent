import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass(true)}>
      <LoadingRegion label="Carregando os planos">
        <Skeleton className="mb-4 ml-1 mt-2 h-9 w-32" />
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="mb-3 h-12 w-44 rounded-full" />
        <Skeleton className="mb-3 h-12 rounded-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="mb-3 h-40 rounded-3xl" />
        ))}
      </LoadingRegion>
    </main>
  );
}
