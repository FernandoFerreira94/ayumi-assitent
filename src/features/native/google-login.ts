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
