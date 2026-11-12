import Link from "next/link";
import { Suspense } from "react";
import { MascotSync } from "@/components/brand/MascotSync";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    // Login sempre com a Bolha e as cores da marca, qualquer que seja o mascote escolhido
    <main data-mascot="bolha" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)]">
      <MascotSync value="bolha" persist={false} />
      <Suspense fallback={<div className="skel h-13 rounded-2xl" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
      <nav className="flex justify-center gap-5 pt-6 text-xs font-semibold text-muted">
        <Link href="/privacidade" className="min-h-11 content-center">Privacidade</Link>
        <Link href="/termos" className="min-h-11 content-center">Termos de uso</Link>
      </nav>
    </main>
  );
}
