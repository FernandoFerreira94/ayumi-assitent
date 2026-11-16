"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { ERROR_MESSAGES, messageFor } from "@/lib/errors";
import { regenerateBackupCodes } from "../actions";
import { BackupCodes } from "./BackupCodes";
import { adminInput } from "./styles";

/** Troca os códigos de recuperação. Pede o código do app ali mesmo: os antigos deixam de valer na hora. */
export function RegenerateCodes() {
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<{ text: string; field: "code" | "password" } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "");
    const password = String(form.get("password") ?? "");
    setPending(true);
    setError(null);
    try {
      const r = await regenerateBackupCodes({ code, password });
      if (!r.ok) {
        const text = messageFor(r.code);
        setError({ text, field: r.code === "ADMIN_PASSWORD_REQUIRED" ? "password" : "code" });
        notify.problem(text);
        return;
      }
      setCodes(r.data.backupCodes);
      setAsking(false);
      notify.success("Códigos novos gerados", "Os antigos não valem mais.");
    } catch {
      setError({ text: ERROR_MESSAGES.NETWORK, field: "code" });
    } finally {
      setPending(false);
    }
  }

  if (codes) return <BackupCodes codes={codes} />;
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="btn-glass min-h-12 rounded-2xl px-5 font-bold">
        Gerar novos códigos de recuperação
      </button>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="grid gap-3" aria-label="Confirmar novos códigos">
      <p className="text-sm font-semibold text-muted">Os 10 códigos atuais deixam de valer assim que os novos forem gerados.</p>
      <div className="grid gap-1">
        <label htmlFor="regen-code" className="pl-1.5 text-xs font-bold text-muted">
          Código do app autenticador
        </label>
        <input
          id="regen-code"
          name="code"
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={7}
          placeholder="000000"
          aria-invalid={error?.field === "code" ? true : undefined}
          aria-describedby={error?.field === "code" ? "regen-error" : undefined}
          className={`${adminInput} text-center tracking-[0.3em]`}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="regen-password" className="pl-1.5 text-xs font-bold text-muted">
          Senha da conta (só se você criou uma)
        </label>
        <input
          id="regen-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={error?.field === "password" ? true : undefined}
          aria-describedby={error?.field === "password" ? "regen-error" : undefined}
          className={adminInput}
        />
      </div>
      {error ? (
        <p id="regen-error" role="alert" className="pl-1.5 text-sm font-semibold text-fail">
          {error.text}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setAsking(false)} className="btn-glass min-h-12 rounded-2xl px-5 font-bold">
          Cancelar
        </button>
        <SubmitButton pending={pending} pendingLabel="Gerando…">
          Gerar novos
        </SubmitButton>
      </div>
    </form>
  );
}
