import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function NotFound() {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] pt-24">
      <EmptyState
        title="Não encontramos isto"
        description="O link pode estar quebrado ou o item foi apagado."
        action={
          <Link
            href="/agenda"
            className="grid min-h-12 place-items-center rounded-2xl bg-primary px-6 font-bold text-on-primary"
          >
            Voltar para a agenda
          </Link>
        }
      />
    </main>
  );
}
