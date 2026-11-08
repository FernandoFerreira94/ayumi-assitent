import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <LoadingRegion label="Carregando o calendário">
        <Skeleton className="mb-2 ml-1 mt-2 h-4 w-40" />
        <Skeleton className="mb-4 ml-1 h-9 w-28" />
        <div className="mb-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mb-3 h-28 rounded-3xl" />
        <Skeleton className="mb-5 h-16 rounded-2xl" />
        {[84, 64, 96, 64].map((h, i) => (
          <Skeleton key={i} className="mb-3 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
