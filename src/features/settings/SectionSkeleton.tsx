import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

/** Esqueleto das seções de Ajustes: header com seta e um ou mais cartões. */
export function SectionSkeleton({ label, cards = 1 }: { label: string; cards?: number }) {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label={label}>
        <Skeleton className="mx-auto mb-5 mt-4 h-5 w-32" />
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="mb-3 h-36 rounded-[1.75rem]" />
        ))}
      </LoadingRegion>
    </main>
  );
}
