import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <LoadingRegion label="Carregando o financeiro">
        <Skeleton className="mb-3 mt-2 h-9 w-9 rounded-full" />
        <Skeleton className="mb-4 ml-1 h-9 w-40" />
        <Skeleton className="mb-4 h-10 rounded-full" />
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
        <Skeleton className="mb-4 h-56 rounded-3xl" />
        {[64, 64, 64].map((h, i) => (
          <Skeleton key={i} className="mb-3 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
