"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { authClient } from "@/lib/auth-client";
import { ERROR_MESSAGES } from "@/lib/errors";

function errorText(code: string | null): string | null {
  if (!code) return null;
  if (code.toUpperCase().includes("NOT_ALLOWED") || code === "unable_to_create_user") return ERROR_MESSAGES.NOT_ALLOWED;
  return "Não foi possível entrar com o Google. Tente de novo.";
}

export function LoginForm() {
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(errorText(params.get("error")));

  async function entrar() {
    setPending(true);
    setError(null);
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/agenda",
      errorCallbackURL: "/login",
    });
    if (res?.error) {
      setError(errorText(res.error.message ?? null) ?? ERROR_MESSAGES.NETWORK);
      setPending(false);
    }
    // Sem erro: o navegador segue para o Google, mantemos o botão em carregamento.
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold text-text">
          {error}
        </p>
      ) : null}
      <SubmitButton type="button" onClick={entrar} pending={pending} pendingLabel="Abrindo o Google…">
        Entrar com Google
      </SubmitButton>
    </div>
  );
}
