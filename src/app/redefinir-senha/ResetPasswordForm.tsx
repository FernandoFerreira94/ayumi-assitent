"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Mascot, type MascotMood } from "@/components/brand/Mascot";
import { Wordmark } from "@/components/brand/Wordmark";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { resetPasswordAndSignIn } from "@/features/auth/actions";
import { messageFor } from "@/lib/errors";
import { LOGIN_INPUT, PasswordInput } from "../login/PasswordInput";

const FIELD_TEXT: Record<string, string> = {
  password: "A senha precisa ter pelo menos 8 caracteres.",
  confirm: "As duas senhas não são iguais.",
};

/** Nova senha pelo link do e-mail: duas vezes a senha, e ao salvar já entra no app. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(resetPasswordAndSignIn, null);
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  // Salvou: segue em "Entrando…" até a navegação terminar
  const done = !!state?.ok;
  const linkDead = !token || (state && !state.ok && state.code === "RESET_LINK_INVALID");

  useEffect(() => {
    if (!state?.ok) return;
    if (state.data.twoFactor) {
      notify.success("Senha nova salva! Entre com ela e o código do app autenticador");
      router.replace("/login");
      return;
    }
    notify.success("Senha nova salva! Abrindo sua agenda");
    router.replace("/agenda");
    router.refresh();
  }, [state, router]);

  const error = state && !state.ok ? ((state.field ? FIELD_TEXT[state.field] : null) ?? messageFor(state.code)) : null;
  let mood: MascotMood = "neutral";
  if (pending) mood = "thinking";
  else if (done) mood = "happy";
  else if (linkDead || error) mood = "worried";
  else if (focus) mood = show ? "peek" : "shy";

  return (
    <div className="grid gap-5">
      <div className="grid justify-items-center gap-0.5 text-center">
        <span className={done ? "react-pulo" : "mascot-float"}>
          <Mascot kind="bolha" mood={mood} size={104} />
        </span>
        <h1 className="mt-1 text-[2.25rem]" aria-label="bubbly">
          <Wordmark />
        </h1>
        <h2 className="mt-1.5 text-xl font-bold">{linkDead ? "Link expirado" : "Crie sua nova senha"}</h2>
        <p className="text-sm font-semibold text-muted">
          {linkDead
            ? "Este link já foi usado ou passou de 30 minutos."
            : "Use pelo menos 8 caracteres. Depois é só entrar."}
        </p>
      </div>

      {linkDead ? (
        <div className="login-view grid gap-3">
          <Link
            href="/login?esqueci=1"
            className="btn-tint flex min-h-13 items-center justify-center rounded-2xl px-5 font-bold"
          >
            Pedir um novo link
          </Link>
          <Link href="/login" className="flex min-h-11 items-center justify-center text-sm font-bold text-muted">
            Voltar para entrar
          </Link>
        </div>
      ) : (
        <form action={action} noValidate className={`login-view grid gap-3 ${error ? "login-shake" : ""}`}>
          {error ? (
            <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
              {error}
            </p>
          ) : null}
          <input type="hidden" name="token" value={token} />
          {/* Gerenciador de senhas do iPhone associa a senha nova ao app */}
          <input type="text" name="username" autoComplete="username" hidden readOnly />
          <PasswordInput
            id="password"
            label="Nova senha"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            meter
            show={show}
            onToggle={() => setShow((v) => !v)}
            onFocusChange={setFocus}
            invalid={state && !state.ok && state.field === "password"}
          />
          <div className="grid gap-1">
            <label htmlFor="confirm" className="pl-1.5 text-xs font-bold text-muted">
              Repita a senha
            </label>
            <input
              id="confirm"
              name="confirm"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Digite de novo"
              aria-invalid={state && !state.ok && state.field === "confirm" ? true : undefined}
              className={LOGIN_INPUT}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
            />
          </div>
          <SubmitButton pending={pending || done} pendingLabel={done ? "Entrando…" : "Salvando…"}>
            Salvar e entrar
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
