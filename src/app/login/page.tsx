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
    </main>
  );
}
