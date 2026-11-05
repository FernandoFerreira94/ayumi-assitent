"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { authClient } from "@/lib/auth-client";
import { ERROR_MESSAGES } from "@/lib/errors";

export function authErrorText(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c.includes("NOT_ALLOWED") || c === "UNABLE_TO_CREATE_USER") return ERROR_MESSAGES.NOT_ALLOWED;
  if (c.includes("INVALID_EMAIL_OR_PASSWORD") || c.includes("INVALID_PASSWORD")) return "E-mail ou senha incorretos.";
  if (c.includes("USER_ALREADY_EXISTS")) return "Este e-mail já tem conta. Entre com a senha.";
  if (c.includes("PASSWORD_TOO_SHORT")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (c.includes("INVALID_EMAIL")) return "E-mail inválido.";
  return "Não foi possível entrar. Tente de novo.";
}

const input =
  "min-h-13 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold outline-none focus:border-primary";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(authErrorText(params.get("error")));

  async function google() {
    setPendingGoogle(true);
    setError(null);
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/agenda",
      errorCallbackURL: "/login",
    });
    if (res?.error) {
      setError(authErrorText(res.error.message) ?? ERROR_MESSAGES.NETWORK);
      setPendingGoogle(false);
    }
    // Sem erro: o navegador segue para o Google; o botão continua em carregamento.
  }

  async function submitEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "").trim();
    setPendingEmail(true);
    setError(null);
    try {
      const res =
        mode === "criar"
          ? await authClient.signUp.email({ name: name || email.split("@")[0], email, password })
          : await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(authErrorText(res.error.code ?? res.error.message));
        return;
      }
      notify.success(mode === "criar" ? "Conta criada" : "Bem-vinda de volta");
      router.replace("/agenda");
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.NETWORK);
    } finally {
      setPendingEmail(false);
    }
  }

  const busy = pendingGoogle || pendingEmail;
  return (
    <div className="grid gap-4">
      {error ? (
        <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold text-text">
          {error}
        </p>
      ) : null}

      <SubmitButton
        type="button"
        onClick={google}
        pending={pendingGoogle}
        disabled={busy}
        pendingLabel="Abrindo o Google…"
      >
        Entrar com Google
      </SubmitButton>

      <p className="text-center text-sm font-bold text-muted">ou com e-mail</p>

      <form onSubmit={submitEmail} className="grid gap-3" noValidate={false}>
        {mode === "criar" ? (
          <label className="grid gap-1 text-sm font-bold">
            Nome
            <input name="name" autoComplete="name" className={input} />
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-bold">
          E-mail
          <input name="email" type="email" required autoComplete="email" inputMode="email" className={input} />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Senha
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "criar" ? "new-password" : "current-password"}
            className={input}
          />
        </label>
        <SubmitButton
          pending={pendingEmail}
          disabled={busy}
          pendingLabel={mode === "criar" ? "Criando conta…" : "Entrando…"}
        >
          {mode === "criar" ? "Criar conta" : "Entrar"}
        </SubmitButton>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "entrar" ? "criar" : "entrar");
          setError(null);
        }}
        className="min-h-11 text-sm font-bold text-primary-text"
      >
        {mode === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta? Entrar"}
      </button>
    </div>
  );
}
