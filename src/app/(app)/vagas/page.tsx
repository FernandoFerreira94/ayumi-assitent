import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Vagas" };

export default function VagasPage() {
  return (
    <PageShell title="Vagas">
      <EmptyState
        title="Horários livres e texto pronto"
        description="Os horários dos próximos 7 dias aparecem aqui, com o texto para divulgar."
      />
    </PageShell>
  );
}
