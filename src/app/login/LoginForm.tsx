"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mascot, type MascotMood } from "@/components/brand/Mascot";
import { Wordmark } from "@/components/brand/Wordmark";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { InstallGuide } from "@/features/install/InstallGuide";
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

type View = "start" | "email" | "signup";
const HEAD: Record<View, [string, string]> = {
  start: ["Que bom te ver!", "Entre para abrir sua agenda."],
  email: ["Entrar com e-mail", "Use o e-mail e a senha da sua conta."],
  signup: ["Criar sua conta", "Leva menos de 1 minuto."],
};

/** Cada toque no Mimo é a próxima reação desta lista, em ordem; só movimento, sem legenda. */
const REACTIONS = ["pulo", "gelatina", "piscadinha", "coracoes", "bolhinhas", "rodopio"] as const;
const REACT_MS = 1300;
/** Quanto tempo a Bolha fica preocupada depois de um erro. */
const WORRY_MS = 2200;

const input =
  "min-h-13 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_4px_var(--soft)] focus:outline-none aria-invalid:border-fail";

function passwordStrength(v: string) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  if (!v) return { pct: 0, label: "Força da senha", color: "var(--line)" };
  if (s >= 3) return { pct: s * 25, label: "Senha forte", color: "var(--ok)" };
  if (s === 2) return { pct: 50, label: "Senha razoável", color: "var(--wait)" };
  return { pct: 25, label: "Senha fraca", color: "var(--fail)" };
}

/** O "G" oficial do Google, nas quatro cores da marca. */
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<View>("start");
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(authErrorText(params.get("error")));
  const [worriedAt, setWorriedAt] = useState(0);
  const [success, setSuccess] = useState(false);
  // O que a Bolha acompanha: o campo em foco, o tamanho do texto digitado e se a senha está à mostra
  const [focus, setFocus] = useState<"text" | "password" | null>(null);
  const [typed, setTyped] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(passwordStrength(""));
  const [reaction, setReaction] = useState<{ n: number; k: (typeof REACTIONS)[number] } | null>(null);
  const taps = useRef(0);

  useEffect(() => {
    if (!reaction) return;
    const id = setTimeout(() => setReaction(null), REACT_MS);
    return () => clearTimeout(id);
  }, [reaction]);
  useEffect(() => {
    if (!worriedAt) return;
    const id = setTimeout(() => setWorriedAt(0), WORRY_MS);
    return () => clearTimeout(id);
  }, [worriedAt]);

  const busy = pendingGoogle || pendingEmail;

  function go(next: View) {
    setView(next);
    setError(null);
    setFocus(null);
    setShowPass(false);
    setStrength(passwordStrength(""));
  }

  function fail(text: string | null) {
    setError(text);
    setWorriedAt(Date.now());
  }

  function tapMascot() {
    if (busy) return;
    const k = REACTIONS[taps.current++ % REACTIONS.length];
    setReaction({ n: taps.current, k });
  }

  async function google() {
    setPendingGoogle(true);
    setError(null);
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/agenda",
      errorCallbackURL: "/login",
    });
    if (res?.error) {
      fail(authErrorText(res.error.message) ?? ERROR_MESSAGES.NETWORK);
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
    if (view === "signup" && name.length < 2) return fail("Digite seu nome.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Digite um e-mail válido, como voce@salao.com.br.");
    if (!password) return fail("Digite sua senha.");
    if (view === "signup" && password.length < 8) return fail("A senha precisa ter pelo menos 8 caracteres.");
    (document.activeElement as HTMLElement | null)?.blur();
    setPendingEmail(true);
    setError(null);
    try {
      const res =
        view === "signup"
          ? await authClient.signUp.email({ name, email, password })
          : await authClient.signIn.email({ email, password });
      if (res.error) return fail(authErrorText(res.error.code ?? res.error.message));
      setSuccess(true);
      notify.success(
        view === "signup" ? `Bem-vinda, ${name.split(" ")[0]}! Conta criada` : "Pronto! Abrindo sua agenda",
      );
      router.replace("/agenda");
      router.refresh();
    } catch {
      fail(ERROR_MESSAGES.NETWORK);
    } finally {
      setPendingEmail(false);
    }
  }

  const worried = worriedAt > 0;
  let mood: MascotMood = "neutral";
  if (busy) mood = "thinking";
  else if (success) mood = "happy";
  else if (worried) mood = "worried";
  else if (focus === "password") mood = showPass ? "peek" : "shy";
  else if (reaction) mood = reaction.k === "piscadinha" ? "wink" : "happy";
  const look: [number, number] = focus === "text" ? [-12 + Math.min(typed, 28) * 0.9, 12] : [0, 0];
  const motion = success ? "react-pulo" : worried ? "login-worry" : reaction ? `react-${reaction.k}` : "mascot-float";

  const textField = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      setFocus("text");
      setTyped(e.currentTarget.value.length);
    },
    onInput: (e: React.FormEvent<HTMLInputElement>) => setTyped(e.currentTarget.value.length),
    onBlur: () => setFocus(null),
  };

  const passwordField = (autoComplete: string, placeholder: string, meter: boolean) => (
    <div className="grid gap-1">
      <label htmlFor="password" className="pl-1.5 text-xs font-bold text-muted">
        Senha
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPass ? "text" : "password"}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${input} pr-12`}
          onFocus={() => setFocus("password")}
          onBlur={() => setFocus(null)}
          onInput={meter ? (e) => setStrength(passwordStrength(e.currentTarget.value)) : undefined}
        />
        <button
          type="button"
          aria-label={showPass ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={showPass}
          // Mantém o foco no campo: assim a Bolha passa de "tapando os olhos" para "espiando"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowPass((v) => !v)}
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-muted"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {showPass ? <path d="M4 4l16 16" /> : null}
          </svg>
        </button>
      </div>
      {meter ? (
        <div className="flex items-center gap-2 pl-1.5 text-xs font-semibold text-muted">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <i
              className="block h-full rounded-full transition-all duration-300"
              style={{ width: `${strength.pct}%`, background: strength.color }}
            />
          </span>
          <span aria-live="polite">{strength.label}</span>
        </div>
      ) : null}
    </div>
  );

  const back = (
    <button
      type="button"
      onClick={() => go("start")}
      className="flex min-h-11 items-center gap-1 self-start text-sm font-bold text-muted"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Voltar
    </button>
  );

  return (
    <div className="grid gap-5">
      <div className="grid justify-items-center gap-0.5 text-center">
        <div className="relative">
          <button
            type="button"
            onClick={tapMascot}
            aria-label="Mimo, toque para brincar"
            className="login-mascot relative grid justify-items-center rounded-3xl"
          >
            <span key={reaction?.n ?? (success ? "ok" : worried ? worriedAt : "idle")} className={motion}>
              <Mascot
                kind="bolha"
                mood={mood}
                look={look}
                size={view === "start" ? 148 : 104}
                className="transition-[width,height] duration-300"
              />
            </span>
            <span className="login-shadow" aria-hidden="true" />
          </button>
          {reaction?.k === "coracoes" || reaction?.k === "bolhinhas" ? (
            <span key={reaction.n} className="pointer-events-none absolute inset-0" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <i
                  key={i}
                  className={reaction.k === "coracoes" ? "login-heart" : "login-bubble"}
                  style={{ left: `${i % 2 ? 72 + (i % 3) * 6 : 12 + (i % 3) * 6}%`, animationDelay: `${i * 70}ms` }}
                />
              ))}
            </span>
          ) : null}
        </div>
        <h1 className="mt-1 text-[2.25rem]" aria-label="mimo">
          <Wordmark />
        </h1>
        <h2 className="mt-1.5 text-xl font-bold">{HEAD[view][0]}</h2>
        <p className="text-sm font-semibold text-muted">{HEAD[view][1]}</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
          {error}
        </p>
      ) : null}

      {view === "start" ? (
        <div key="start" className="login-view grid gap-3">
          <SubmitButton
            type="button"
            onClick={google}
            pending={pendingGoogle}
            disabled={busy}
            pendingLabel="Abrindo o Google…"
          >
            <span className="flex items-center gap-2.5">
              {/* O "G" do Google pede fundo branco; no botão lavanda ele vai num círculo */}
              <span className="grid size-7 place-items-center rounded-full bg-white">
                <GoogleG />
              </span>
              Entrar com Google
            </span>
          </SubmitButton>
          <button
            type="button"
            onClick={() => go("email")}
            disabled={busy}
            className="flex min-h-13 items-center justify-center gap-2.5 rounded-2xl bg-soft px-5 font-bold text-primary-text"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="4" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            Continuar com e-mail
          </button>
          <p className="text-center text-sm font-semibold text-muted">
            Não tem conta?{" "}
            <button type="button" onClick={() => go("signup")} className="min-h-11 font-bold text-primary-text">
              Criar conta com e-mail
            </button>
          </p>
          <InstallGuide compact />
        </div>
      ) : (
        <form
          key={view}
          onSubmit={submitEmail}
          noValidate
          className={`login-view grid gap-3 ${worried ? "login-shake" : ""}`}
        >
          {back}
          {view === "signup" ? (
            <div className="grid gap-1">
              <label htmlFor="name" className="pl-1.5 text-xs font-bold text-muted">
                Nome
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="Como quer ser chamada"
                className={input}
                {...textField}
              />
            </div>
          ) : null}
          <div className="grid gap-1">
            <label htmlFor="email" className="pl-1.5 text-xs font-bold text-muted">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete={view === "signup" ? "email" : "username"}
              inputMode="email"
              placeholder="voce@salao.com.br"
              autoFocus
              className={input}
              {...textField}
            />
          </div>
          {view === "signup"
            ? passwordField("new-password", "Mínimo de 8 caracteres", true)
            : passwordField("current-password", "Sua senha", false)}
          <SubmitButton
            pending={pendingEmail}
            disabled={busy}
            pendingLabel={view === "signup" ? "Criando conta…" : "Entrando…"}
          >
            {view === "signup" ? "Criar conta" : "Entrar"}
          </SubmitButton>
          <p className="text-center text-sm font-semibold text-muted">
            {view === "signup" ? "Já tem conta? " : "Ainda não tem conta? "}
            <button
              type="button"
              onClick={() => go(view === "signup" ? "email" : "signup")}
              className="min-h-11 font-bold text-primary-text"
            >
              {view === "signup" ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
