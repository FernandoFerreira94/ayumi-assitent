import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label="Carregando o perfil">
        <Skeleton className="mb-3 mt-2 h-9 w-9 rounded-full" />
        <Skeleton className="mb-4 ml-1 h-9 w-40" />
        <div className="mb-5 flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[52, 52, 52, 52].map((h, i) => (
          <Skeleton key={i} className="mb-3 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
