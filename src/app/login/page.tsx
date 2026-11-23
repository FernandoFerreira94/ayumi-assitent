import type { Metadata } from "next";
import { SHARE_DESCRIPTION, shareMeta } from "@/lib/share-meta";
import { Suspense } from "react";
import { MascotSync } from "@/components/brand/MascotSync";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar", ...shareMeta("bubbly · agenda do seu estúdio", SHARE_DESCRIPTION, "/login") };

export default function LoginPage() {
  return (
    // Login sempre com a Bolha e as cores da marca, qualquer que seja o mascote escolhido
    <main data-mascot="bolha" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)]">
      <MascotSync value="bolha" persist={false} />
      <Suspense fallback={<div className="skel h-13 rounded-2xl" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
      <nav className="flex justify-center gap-5 pt-6 text-xs font-semibold text-muted">
        <a href={PRIVACY_URL} className="min-h-11 content-center">Privacidade</a>
        <a href={TERMS_URL} className="min-h-11 content-center">Termos de uso</a>
      </nav>
    </main>
  );
}
