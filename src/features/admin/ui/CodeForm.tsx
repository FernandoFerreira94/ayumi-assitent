"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { messageFor, ERROR_MESSAGES } from "@/lib/errors";
import { verifyAdminCode } from "../actions";
import { adminCard, adminInput } from "./styles";

/** Pede o código do app autenticador (ou um de recuperação) e libera o painel por 12 h. */
export function CodeForm() {
  const router = useRouter();
  const [recovery, setRecovery] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setPending(true);
    setError(null);
    try {
      const r = await verifyAdminCode({ code });
      if (!r.ok) {
        const text = messageFor(r.code);
        setError(text);
        notify.problem(text);
        return;
      }
      notify.success("Acesso liberado por 12 horas");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.NETWORK);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className={adminCard}>
      <div className="grid gap-1">
        <label htmlFor="code" className="pl-1.5 text-xs font-bold text-muted">
          {recovery ? "Código de recuperação" : "Código do app autenticador"}
        </label>
        <input
          key={recovery ? "rec" : "totp"}
          id="code"
          name="code"
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode={recovery ? "text" : "numeric"}
          maxLength={recovery ? 11 : 7}
          placeholder={recovery ? "AbCde-FgHij" : "000000"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "code-error" : undefined}
          className={`${adminInput} text-center tracking-[0.3em]`}
        />
        {error ? (
          <p id="code-error" role="alert" className="pl-1.5 text-sm font-semibold text-fail">
            {error}
          </p>
        ) : null}
      </div>
      <SubmitButton pending={pending} pendingLabel="Conferindo…">
        Confirmar
      </SubmitButton>
      <button
        type="button"
        onClick={() => {
          setRecovery((v) => !v);
          setError(null);
        }}
        className="min-h-11 text-sm font-bold text-primary-text"
      >
        {recovery ? "Usar o app autenticador" : "Usar código de recuperação"}
      </button>
    </form>
  );
}
