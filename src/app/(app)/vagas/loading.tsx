import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <LoadingRegion label="Carregando vagas">
        <Skeleton className="mb-1 ml-1 mt-2 h-9 w-32" />
        <Skeleton className="mb-4 ml-1 h-4 w-56" />
        <Skeleton className="mb-4 h-11 rounded-2xl" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mb-3 rounded-[20px] bg-surface p-3">
            <Skeleton className="mb-3 h-5 w-36" />
            <div className="flex flex-wrap gap-2">
              {[120, 130, 110].map((w, j) => (
                <Skeleton key={j} className="h-10 rounded-xl" style={{ width: w }} />
              ))}
            </div>
          </div>
        ))}
      </LoadingRegion>
    </main>
  );
}
