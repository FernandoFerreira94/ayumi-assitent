import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage() {
  return (
    <PageShell title="Hoje">
      <EmptyState
        title="Sua agenda aparece aqui"
        description="Na próxima fase, os atendimentos do dia e o previsto entram nesta tela."
      />
    </PageShell>
  );
}
