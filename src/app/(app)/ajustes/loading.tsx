import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label="Carregando ajustes">
        <Skeleton className="mb-4 ml-1 mt-2 h-9 w-36" />
        <Skeleton className="mb-5 h-20 rounded-[20px]" />
        {[2, 3].map((n) => (
          <div key={n} className="mb-5">
            <Skeleton className="mb-2 ml-2 h-3 w-24" />
            <div className="rounded-[18px] bg-surface p-2">
              {Array.from({ length: n }, (_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-[30px] w-[30px] rounded-[9px]" />
                  <div className="grid flex-1 gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </LoadingRegion>
    </main>
  );
}
