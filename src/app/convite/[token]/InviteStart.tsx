"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { GoogleG } from "@/app/login/LoginForm";
import { authClient } from "@/lib/auth-client";
import { ERROR_MESSAGES, messageFor } from "@/lib/errors";
import { startInvite } from "@/features/team/actions";

/** Guarda o convite num cookie e segue para o Google; o cadastro lê o cookie e entra no salão. */
export function InviteStart({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setPending(true);
    setError(null);
    try {
      const res = await startInvite(token);
      if (!res.ok) throw new Error(messageFor(res.code));
      const auth = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/agenda",
        errorCallbackURL: "/login",
      });
      if (auth?.error) throw new Error(ERROR_MESSAGES.NETWORK);
    } catch (e) {
      setError(e instanceof Error ? e.message : ERROR_MESSAGES.NETWORK);
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
          {error}
        </p>
      ) : null}
      <SubmitButton type="button" onClick={go} pending={pending} pendingLabel="Abrindo o Google…">
        <span className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-full bg-white">
            <GoogleG />
          </span>
          Entrar com Google
        </span>
      </SubmitButton>
    </div>
  );
}
