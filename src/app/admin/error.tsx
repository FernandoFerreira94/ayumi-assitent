"use client";

import { ErrorState } from "@/components/feedback/ErrorState";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} homeHref="/admin" homeLabel="Voltar para a visão geral" />;
}
