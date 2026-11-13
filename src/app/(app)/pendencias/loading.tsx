import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label="Carregando pendências">
        <Skeleton className="mb-4 ml-1 mt-2 h-9 w-40" />
        {[84, 84, 84].map((h, i) => (
          <Skeleton key={i} className="mb-3 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
