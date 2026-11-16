"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { ERROR_MESSAGES, messageFor, type ErrorCode } from "@/lib/errors";
import { confirmTwoFactorSetup, startTwoFactorSetup } from "../actions";
import { BackupCodes } from "./BackupCodes";
import { adminCard, adminInput } from "./styles";

type Setup = { qr: string; secret: string; backupCodes: string[] };

/** Ativação do 2FA em 3 passos: ler o QR, guardar os códigos de recuperação, confirmar com o primeiro código. */
export function TwoFactorSetup() {
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);

  function problem(code: ErrorCode, field?: string) {
    const text = messageFor(code);
    setError({ text, field });
    notify.problem(text);
  }

  async function start(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setPending(true);
    setError(null);
    try {
      const r = await startTwoFactorSetup({ password });
      if (!r.ok) return problem(r.code, r.field);
      setSetup(r.data);
    } catch {
      setError({ text: ERROR_MESSAGES.NETWORK });
    } finally {
      setPending(false);
    }
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setPending(true);
    setError(null);
    try {
      const r = await confirmTwoFactorSetup({ code });
      if (!r.ok) return problem(r.code, r.field);
      notify.success("2FA ativado", "Agora confirme com um código novo para abrir o painel.");
      router.replace("/admin/verificar");
      router.refresh();
    } catch {
      setError({ text: ERROR_MESSAGES.NETWORK });
    } finally {
      setPending(false);
    }
  }

  const errorText = error ? (
    <p id="setup-error" role="alert" className="pl-1.5 text-sm font-semibold text-fail">
      {error.text}
    </p>
  ) : null;

  if (!setup) {
    return (
      <form onSubmit={start} noValidate className={adminCard}>
        <p className="text-sm font-semibold text-muted">
          Você vai precisar de um app autenticador no celular (Google Authenticator, 1Password ou Senhas do iPhone).
        </p>
        <div className="grid gap-1">
          <label htmlFor="password" className="pl-1.5 text-xs font-bold text-muted">
            Senha da conta (só se você criou uma em Ajustes)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={error?.field === "password" ? true : undefined}
            aria-describedby={error ? "setup-error" : undefined}
            className={adminInput}
          />
          {errorText}
        </div>
        <SubmitButton pending={pending} pendingLabel="Preparando…">
          Começar
        </SubmitButton>
      </form>
    );
  }

  if (!saved) {
    return (
      <div className={adminCard}>
        <h2 className="text-lg font-bold">1. Leia o QR no app autenticador</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerado no servidor */}
        <img
          src={setup.qr}
          alt="QR code para o app autenticador"
          width={240}
          height={240}
          className="mx-auto rounded-2xl bg-white p-2"
        />
        <p className="text-center text-sm font-semibold text-muted">
          Sem câmera? Digite a chave: <span className="break-all font-mono">{setup.secret}</span>
        </p>
        <h2 className="text-lg font-bold">2. Guarde os códigos de recuperação</h2>
        <BackupCodes codes={setup.backupCodes} />
        <button type="button" onClick={() => setSaved(true)} className="btn-glass min-h-12 rounded-2xl px-5 font-bold">
          Já guardei, continuar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={confirm} noValidate className={adminCard}>
      <h2 className="text-lg font-bold">3. Digite o código que aparece no app</h2>
      <div className="grid gap-1">
        <label htmlFor="code" className="pl-1.5 text-xs font-bold text-muted">
          Código de 6 números
        </label>
        <input
          id="code"
          name="code"
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={7}
          placeholder="000000"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "setup-error" : undefined}
          className={`${adminInput} text-center tracking-[0.3em]`}
        />
        {errorText}
      </div>
      <SubmitButton pending={pending} pendingLabel="Ativando…">
        Ativar 2FA
      </SubmitButton>
      <button type="button" onClick={() => setSaved(false)} className="min-h-11 text-sm font-bold text-primary-text">
        Voltar para o QR
      </button>
    </form>
  );
}
