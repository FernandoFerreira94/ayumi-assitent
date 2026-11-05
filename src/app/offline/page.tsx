import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";

export const metadata: Metadata = { title: "Sem internet" };

export default function OfflinePage() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] pt-24">
      <EmptyState
        title="Você está sem internet"
        description="Assim que a conexão voltar, o app atualiza sozinho. Tente de novo em instantes."
      />
    </main>
  );
}
