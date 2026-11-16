import type { Metadata } from "next";
import { Suspense } from "react";
import { MascotSync } from "@/components/brand/MascotSync";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false, follow: false } };

/**
 * Destino do link do e-mail "Esqueci a senha". O Better Auth confere o link em /api/auth/reset-password/<token> e
 * manda para cá com ?token= (válido) ou ?error=INVALID_TOKEN (expirado ou já usado). Pública no proxy.
 */
async function Form({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  const valid = !error && typeof token === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(token);
  return <ResetPasswordForm token={valid ? token : null} />;
}

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  return (
    <main
      data-mascot="bolha"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)]"
    >
      <MascotSync value="bolha" persist={false} />
      <Suspense fallback={<div className="skel h-13 rounded-2xl" aria-hidden="true" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
