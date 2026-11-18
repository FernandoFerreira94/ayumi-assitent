"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mascot, type MascotMood } from "@/components/brand/Mascot";
import { Wordmark } from "@/components/brand/Wordmark";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { InstallGuide } from "@/features/install/InstallGuide";
import { isNativeShell } from "@/features/install/platform";
import { authClient } from "@/lib/auth-client";
import { ERROR_MESSAGES } from "@/lib/errors";
import { LOGIN_INPUT as input, PasswordInput } from "./PasswordInput";

/** E-mail fora da lista de acesso (piloto): explica o que fazer, em vez de só "sem acesso". */
export const LOGIN_NOT_ALLOWED =
  "Este e-mail ainda não está liberado no app. Fale com o suporte para liberar o acesso.";

export function authErrorText(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c.includes("INVITE_EXPIRED")) return ERROR_MESSAGES.INVITE_EXPIRED;
  if (c.includes("INVITE_USED")) return ERROR_MESSAGES.INVITE_USED;
  if (c.includes("INVITE_INVALID")) return ERROR_MESSAGES.INVITE_INVALID;
  if (c.includes("NOT_ALLOWED") || c === "UNABLE_TO_CREATE_USER") return LOGIN_NOT_ALLOWED;
  if (c.includes("INVALID_EMAIL_OR_PASSWORD") || c.includes("INVALID_PASSWORD")) return "E-mail ou senha incorretos.";
  if (c.includes("USER_ALREADY_EXISTS")) return "Este e-mail já tem conta. Entre com a senha.";
  if (c.includes("PASSWORD_TOO_SHORT")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (c.includes("INVALID_EMAIL")) return "E-mail inválido.";
  if (c.includes("INVALID_CODE") || c.includes("INVALID_BACKUP_CODE"))
    return "Código inválido. Confira o app autenticador.";
  if (c.includes("TOO_MANY") || c.includes("LOCKED"))
    return "Muitas tentativas. Entre de novo com a senha daqui a 15 minutos.";
  if (c.includes("TWO_FACTOR_COOKIE")) return "O tempo para digitar o código acabou. Entre de novo com a senha.";
  return "Não foi possível entrar. Tente de novo.";
}

// Conta nova só pelo Google (e-mail já verificado por ele); e-mail e senha só para entrar.
// "code": conta com 2FA (só o dono do produto) pede o código do app autenticador depois da senha.
// "forgot"/"sent": esqueci a senha (link por e-mail, que leva para /redefinir-senha).
type View = "start" | "email" | "code" | "forgot" | "sent";
const HEAD: Record<View, [string, string]> = {
  start: ["Que bom te ver!", "Entre para abrir sua agenda."],
  email: ["Entrar com e-mail", "Use o e-mail e a senha da sua conta."],
  code: ["Código de acesso", "Digite os 6 números do app autenticador."],
  forgot: ["Esqueceu a senha?", "Mandamos um link para você criar uma nova."],
  sent: ["Confira seu e-mail", "Se existir conta com esse e-mail, o link chega em instantes."],
};

/** Cada toque no Bubbly é a próxima reação desta lista, em ordem; só movimento, sem legenda. */
const REACTIONS = ["pulo", "gelatina", "piscadinha", "coracoes", "bolhinhas", "rodopio"] as const;
const REACT_MS = 1300;
/** Quanto tempo a Bolha fica preocupada depois de um erro. */
const WORRY_MS = 2200;

/** O "G" oficial do Google, nas quatro cores da marca. */
export function GoogleG() {
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
  const [view, setView] = useState<View>(params.get("esqueci") ? "forgot" : "start");
  // E-mail digitado numa tela já vem preenchido na outra (entrar ↔ esqueci a senha)
  const [email, setEmail] = useState("");
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(authErrorText(params.get("error")));
  // Chegou com erro do Google: a Bolha já abre preocupada.
  const [worriedAt, setWorriedAt] = useState(() => (params.get("error") ? Date.now() : 0));
  const [success, setSuccess] = useState(false);
  // O que a Bolha acompanha: o campo em foco, o tamanho do texto digitado e se a senha está à mostra
  const [focus, setFocus] = useState<"text" | "password" | null>(null);
  const [typed, setTyped] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [reaction, setReaction] = useState<{ n: number; k: (typeof REACTIONS)[number] } | null>(null);
  const taps = useRef(0);

  // Voltou do Google com erro (?error=...): toast com a Bolha preocupada e limpa o endereço.
  useEffect(() => {
    const text = authErrorText(params.get("error"));
    if (!text) return;
    notify.problem(text);
    router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na chegada à tela
  }, []);

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
    // App da loja: o Google não deixa entrar na WebView; abre o navegador do sistema e volta pelo link do app
    if (isNativeShell(navigator.userAgent)) {
      try {
        const { startNativeGoogleLogin } = await import("@/features/native/google-login");
        await startNativeGoogleLogin(() => setPendingGoogle(false));
      } catch {
        fail(ERROR_MESSAGES.NETWORK);
        setPendingGoogle(false);
      }
      return;
    }
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/entrar",
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
    setEmail(email);
    const password = String(fd.get("password") ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Digite um e-mail válido, como voce@salao.com.br.");
    if (!password) return fail("Digite sua senha.");
    (document.activeElement as HTMLElement | null)?.blur();
    setPendingEmail(true);
    setError(null);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) return fail(authErrorText(res.error.code ?? res.error.message));
      if (res.data && "twoFactorRedirect" in res.data && res.data.twoFactorRedirect) return go("code");
      setSuccess(true);
      notify.success("Pronto! Entrando");
      // Navegação completa: o /entrar lê a sessão nova e leva ao Painel (ou ao /admin, se for o dono)
      window.location.replace("/entrar");
    } catch {
      fail(ERROR_MESSAGES.NETWORK);
    } finally {
      setPendingEmail(false);
    }
  }

  async function submitForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const typed = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(typed)) return fail("Digite um e-mail válido, como voce@salao.com.br.");
    (document.activeElement as HTMLElement | null)?.blur();
    setEmail(typed);
    setPendingEmail(true);
    setError(null);
    try {
      // Resposta igual exista ou não a conta: a tela nunca diz se o e-mail está cadastrado
      const res = await authClient.requestPasswordReset({ email: typed, redirectTo: "/redefinir-senha" });
      if (res.error) {
        const c = (res.error.code ?? "").toUpperCase();
        return fail(
          res.error.status === 429 || c.includes("TOO_MANY")
            ? "Muitos pedidos seguidos. Espere alguns minutos e tente de novo."
            : ERROR_MESSAGES.UNKNOWN,
        );
      }
      go("sent");
    } catch {
      fail(ERROR_MESSAGES.NETWORK);
    } finally {
      setPendingEmail(false);
    }
  }

  async function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    if (!code) return fail("Digite o código.");
    (document.activeElement as HTMLElement | null)?.blur();
    setPendingEmail(true);
    setError(null);
    try {
      // 6 números = app autenticador; o resto é código de recuperação
      const res = /^\d{6}$/.test(code)
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyBackupCode({ code });
      if (res.error) return fail(authErrorText(res.error.code ?? res.error.message));
      setSuccess(true);
      notify.success("Pronto! Entrando");
      // Navegação completa: o /entrar lê a sessão nova e leva ao Painel (ou ao /admin, se for o dono)
      window.location.replace("/entrar");
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
            aria-label="Bubbly, toque para brincar"
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
        <h1 className="mt-1 text-[2.25rem]" aria-label="bubbly">
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
            Primeira vez? Entre com o Google e sua conta é criada na hora.
          </p>
          <InstallGuide compact />
        </div>
      ) : view === "code" ? (
        <form
          key="code"
          onSubmit={submitCode}
          noValidate
          className={`login-view grid gap-3 ${worried ? "login-shake" : ""}`}
        >
          {back}
          <div className="grid gap-1">
            <label htmlFor="code" className="pl-1.5 text-xs font-bold text-muted">
              Código
            </label>
            <input
              id="code"
              name="code"
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={11}
              placeholder="000000"
              autoFocus
              className={`${input} text-center tracking-[0.3em]`}
              {...textField}
            />
          </div>
          <SubmitButton pending={pendingEmail} disabled={busy} pendingLabel="Conferindo…">
            Confirmar
          </SubmitButton>
          <p className="text-center text-sm font-semibold text-muted">
            Sem o celular? Use um dos códigos de recuperação.
          </p>
        </form>
      ) : view === "forgot" ? (
        <form
          key="forgot"
          onSubmit={submitForgot}
          noValidate
          className={`login-view grid gap-3 ${worried ? "login-shake" : ""}`}
        >
          <button
            type="button"
            onClick={() => go("email")}
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
          <div className="grid gap-1">
            <label htmlFor="forgot-email" className="pl-1.5 text-xs font-bold text-muted">
              E-mail da conta
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              placeholder="voce@salao.com.br"
              defaultValue={email}
              autoFocus
              className={input}
              {...textField}
            />
          </div>
          <SubmitButton pending={pendingEmail} disabled={busy} pendingLabel="Enviando…">
            Enviar link
          </SubmitButton>
          <p className="text-center text-sm font-semibold text-muted">
            Entra pelo Google? Use o botão do Google, não precisa de senha.
          </p>
        </form>
      ) : view === "sent" ? (
        <div key="sent" className="login-view grid gap-3">
          <div className="grid gap-1.5 rounded-2xl bg-soft px-4 py-3.5 text-sm font-semibold text-primary-text">
            <p>
              Enviamos para <strong className="break-all">{email}</strong>. O link vale por 30 minutos e só funciona uma
              vez.
            </p>
            <p className="font-medium">Não chegou? Olhe a caixa de spam ou Promoções.</p>
          </div>
          <SubmitButton type="button" onClick={() => go("email")} pendingLabel="Voltando…">
            Voltar para entrar
          </SubmitButton>
          <button
            type="button"
            onClick={() => go("forgot")}
            className="flex min-h-11 items-center justify-center text-sm font-bold text-muted"
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form
          key={view}
          onSubmit={submitEmail}
          noValidate
          className={`login-view grid gap-3 ${worried ? "login-shake" : ""}`}
        >
          {back}
          <div className="grid gap-1">
            <label htmlFor="email" className="pl-1.5 text-xs font-bold text-muted">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              placeholder="voce@salao.com.br"
              defaultValue={email}
              autoFocus
              className={input}
              {...textField}
            />
          </div>
          <PasswordInput
            id="password"
            label="Senha"
            autoComplete="current-password"
            placeholder="Sua senha"
            show={showPass}
            onToggle={() => setShowPass((v) => !v)}
            onFocusChange={(f) => setFocus(f ? "password" : null)}
          />
          <button
            type="button"
            onClick={() => go("forgot")}
            disabled={busy}
            className="-mt-1 flex min-h-11 items-center self-end justify-self-end px-1.5 text-sm font-bold text-primary-text"
          >
            Esqueci minha senha
          </button>
          <SubmitButton pending={pendingEmail} disabled={busy} pendingLabel="Entrando…">
            Entrar
          </SubmitButton>
          <p className="text-center text-sm font-semibold text-muted">
            Ainda não tem conta? Volte e entre com o Google.
          </p>
        </form>
      )}
    </div>
  );
}
