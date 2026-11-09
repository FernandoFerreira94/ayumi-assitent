import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <LoadingRegion label="Carregando os serviços">
        <Skeleton className="mb-3 mt-2 h-9 w-9 rounded-full" />
        <Skeleton className="mb-4 ml-1 h-9 w-40" />
        <Skeleton className="mb-3 h-11 rounded-2xl" />
        <div className="rounded-[18px] bg-surface p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-2">
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </LoadingRegion>
    </main>
  );
}
