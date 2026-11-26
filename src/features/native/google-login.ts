"use client";

/**
 * Lado do app (WebView) do login do Google na casca nativa. Ver o fluxo em handoff-core.ts.
 * Os plugins do Capacitor só são carregados aqui, sob demanda: no navegador comum nada disso entra no bundle inicial.
 */
const VERIFIER_KEY = "bubbly:native-auth-verifier";

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Abre o Google no navegador do sistema. `onClosed` roda se a pessoa fechar o navegador sem terminar. */
export async function startNativeGoogleLogin(onClosed: () => void): Promise<void> {
  const { Browser } = await import("@capacitor/browser");
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))),
  );
  // localStorage (não sessionStorage): sobrevive se o Android fechar a WebView enquanto o navegador está na frente
  localStorage.setItem(VERIFIER_KEY, verifier);
  const closed = await Browser.addListener("browserFinished", () => {
    void closed.remove();
    onClosed();
  });
  await Browser.open({ url: `${location.origin}/api/native-auth/start?challenge=${challenge}` });
}

/** Link br.app.bubbly://auth?... recebido pelo app: fecha o navegador e troca o código pela sessão. */
export async function finishNativeGoogleLogin(link: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { Browser } = await import("@capacitor/browser");
  await Browser.removeAllListeners().catch(() => undefined);
  await Browser.close().catch(() => undefined); // no Android o Custom Tab já fechou: ignora o erro
  const url = new URL(link);
  const verifier = localStorage.getItem(VERIFIER_KEY);
  localStorage.removeItem(VERIFIER_KEY);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (error || !code || !verifier) return { ok: false, error: error ?? "UNKNOWN" };
  const res = await fetch("/api/native-auth/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, verifier }),
    credentials: "same-origin",
  }).catch(() => null);
  if (!res?.ok) return { ok: false, error: "EXPIRED" };
  return { ok: true };
}

const LINK_BACK_KEY = "bubbly:native-link-back";

/**
 * Liga o Google Agenda pelo navegador do sistema (quem já está logado no app). `back` é a tela que volta depois;
 * fica guardada aqui, não no link. Resolve false se nem deu para abrir (sem rede, sessão expirada).
 */
export async function startNativeGoogleLink(back: string, onClosed: () => void): Promise<boolean> {
  const res = await fetch("/api/native-auth/link-start", { method: "POST", credentials: "same-origin" }).catch(
    () => null,
  );
  const body = (await res?.json().catch(() => null)) as { token?: unknown } | null;
  if (!res?.ok || typeof body?.token !== "string") return false;
  const { Browser } = await import("@capacitor/browser");
  localStorage.setItem(LINK_BACK_KEY, back);
  const closed = await Browser.addListener("browserFinished", () => {
    void closed.remove();
    onClosed();
  });
  await Browser.open({ url: `${location.origin}/api/native-auth/link?token=${encodeURIComponent(body.token)}` });
  return true;
}

/** Link br.app.bubbly://google?ok=1 (ou ?error=...): fecha o navegador e diz para onde a WebView volta. */
export async function finishNativeGoogleLink(link: string): Promise<string> {
  const { Browser } = await import("@capacitor/browser");
  await Browser.removeAllListeners().catch(() => undefined);
  await Browser.close().catch(() => undefined);
  const back = localStorage.getItem(LINK_BACK_KEY);
  localStorage.removeItem(LINK_BACK_KEY);
  return linkBackPath(back, new URL(link).searchParams.get("error"));
}

/** Só as telas que ligam o Google; o erro segue no mesmo formato do fluxo do site (?google=erro&error=...). */
export function linkBackPath(back: string | null, error: string | null): string {
  const base = back === "/primeiro-acesso?etapa=agenda" ? back : "/ajustes/calendarios";
  if (!error) return base;
  const code = /^[A-Za-z_]{1,60}$/.test(error) ? error : "UNKNOWN";
  return `${base}${base.includes("?") ? "&" : "?"}google=erro&error=${code}`;
}
