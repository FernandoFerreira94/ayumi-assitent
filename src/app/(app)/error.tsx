"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] pt-24">
      <ErrorState onRetry={retry} />
    </main>
  );
}
