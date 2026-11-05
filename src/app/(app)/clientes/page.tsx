import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return (
    <PageShell title="Clientes">
      <EmptyState title="Nenhuma cliente ainda" description="Cadastre a primeira cliente para começar a agendar." />
    </PageShell>
  );
}
