import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <LoadingRegion label="Carregando pendências">
        <Skeleton className="mb-4 ml-1 mt-2 h-9 w-40" />
        {[84, 84, 84].map((h, i) => (
          <Skeleton key={i} className="mb-3 rounded-2xl" style={{ height: h }} />
        ))}
      </LoadingRegion>
    </main>
  );
}
