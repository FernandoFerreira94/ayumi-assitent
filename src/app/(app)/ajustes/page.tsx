import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Ajustes" };

export default function AjustesPage() {
  return (
    <PageShell title="Ajustes">
      <EmptyState
        title="Configurações do estúdio"
        description="Expediente, serviços, lembretes e conexões entram nesta tela."
      />
    </PageShell>
  );
}
