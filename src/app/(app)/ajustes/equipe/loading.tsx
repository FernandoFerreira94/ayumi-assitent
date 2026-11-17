import { pageMainClass } from "@/components/ui/page-main";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className={pageMainClass()}>
      <LoadingRegion label="Carregando equipe">
        <Skeleton className="mb-4 ml-1 mt-2 h-9 w-36" />
        <Skeleton className="mb-3 h-12 rounded-full" />
        <Skeleton className="h-48 rounded-2xl" />
      </LoadingRegion>
    </main>
  );
}
