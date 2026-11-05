import { Suspense } from "react";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="grid justify-items-center gap-3 text-center">
        <Logo size={72} className="text-primary" />
        <h1 className="text-2xl font-bold">Assist Agent</h1>
        <p className="text-muted">Sua agenda do salão, organizada e sempre à mão.</p>
      </div>
      <Suspense fallback={<div className="skel h-13 rounded-2xl" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
