import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label="Carregando clientes">
        <Skeleton className="mb-1 ml-1 mt-2 h-9 w-40" />
        <Skeleton className="mb-4 ml-1 h-4 w-24" />
        <Skeleton className="mb-3 h-11 rounded-2xl" />
        <div className="mb-4 flex gap-2">
          {[64, 96, 150].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <Skeleton className="mb-2 ml-1 h-3 w-4" />
        <div className="rounded-[18px] bg-surface p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          ))}
        </div>
      </LoadingRegion>
    </main>
  );
}
