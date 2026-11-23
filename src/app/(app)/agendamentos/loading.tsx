import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass(true)}>
      <LoadingRegion label="Carregando agendamentos">
        <Skeleton className="mb-4 ml-1 mt-2 h-9 w-48" />
        <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mb-4 h-12 rounded-full" />
        {[64, 64, 64, 64].map((h, i) => (
          <Skeleton key={i} className="mb-2 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
