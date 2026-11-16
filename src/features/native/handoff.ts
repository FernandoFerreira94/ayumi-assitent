import "server-only";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canonicalRedirect } from "@/lib/canonical-host";
import { errCode, log } from "@/lib/log";
import {
  CHALLENGE_COOKIE,
  CODE_TTL_MS,
  codeKey,
  isChallenge,
  newCode,
  returnUrl,
  safeErrorCode,
  verifierMatches,
} from "./handoff-core";

const FINISH = "/api/native-auth/finish";

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookieNames(req: Request): string[] {
  return (req.headers.get("cookie") ?? "")
    .split(";")
    .map((p) => p.trim().split("=")[0])
    .filter(Boolean);
}

/** Passo 1 (navegador do sistema): guarda o challenge num cookie curto e segue para o Google. */
export async function startNativeGoogle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // O Google volta para o domínio oficial (BETTER_AUTH_URL): o cookie de state tem de nascer lá também
  const canonical = canonicalRedirect(req.headers.get("x-forwarded-host") ?? req.headers.get("host"), url);
  if (canonical) return Response.redirect(canonical, 302);
  const challenge = url.searchParams.get("challenge");
  if (!isChallenge(challenge)) return backToApp({ error: "INVALID_REQUEST" });
  const res = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: FINISH, errorCallbackURL: FINISH, disableRedirect: true },
    headers: req.headers,
    asResponse: true,
  });
  const body = (await res.json().catch(() => null)) as { url?: unknown } | null;
  if (!res.ok || typeof body?.url !== "string") return backToApp({ error: "UNKNOWN" });
  const out = new Response(null, { status: 302, headers: { Location: body.url, "Cache-Control": "no-store" } });
  for (const c of res.headers.getSetCookie()) out.headers.append("Set-Cookie", c);
  out.headers.append(
    "Set-Cookie",
    `${CHALLENGE_COOKIE}=${challenge}; Path=/api; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
  );
  return out;
}

/**
 * Passo 2 (navegador, volta do Google): a sessão aberta no navegador vira um código de uso único para o app.
 * O navegador esquece a sessão (cookies apagados); quem fica com ela é a WebView do app.
 */
export async function finishNativeGoogle(req: Request): Promise<Response> {
  const challenge = readCookie(req, CHALLENGE_COOKIE);
  const error = new URL(req.url).searchParams.get("error");
  if (error) return backToApp({ error: safeErrorCode(error) }, req);
  if (!isChallenge(challenge)) return backToApp({ error: "INVALID_REQUEST" }, req);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return backToApp({ error: "UNKNOWN" }, req);
  try {
    const { token } = await auth.api.generateOneTimeToken({ headers: req.headers });
    const code = newCode();
    const ctx = await auth.$context;
    await ctx.internalAdapter.createVerificationValue({
      identifier: codeKey(code),
      value: JSON.stringify({ ott: token, challenge }),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    return backToApp({ code }, req);
  } catch (e) {
    log("error", "native_auth_finish_failed", errCode(e));
    return backToApp({ error: "UNKNOWN" }, req);
  }
}

const exchangeBody = z.object({ code: z.string().min(20).max(100), verifier: z.string().min(43).max(128) });

/** Passo 3 (WebView do app): confere o segredo e abre a sessão com o cookie do Better Auth. */
export async function exchangeNativeCode(req: Request): Promise<Response> {
  const parsed = exchangeBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  const ctx = await auth.$context;
  // Consome antes de conferir: código errado ou repetido nunca vale uma segunda vez
  const row = await ctx.internalAdapter.consumeVerificationValue(codeKey(parsed.data.code));
  if (!row || new Date(row.expiresAt) < new Date()) {
    return Response.json({ ok: false, error: "EXPIRED" }, { status: 400 });
  }
  let stored: { ott?: unknown; challenge?: unknown } = {};
  try {
    stored = JSON.parse(row.value);
  } catch {
    // valor corrompido: cai no erro abaixo
  }
  if (typeof stored.ott !== "string" || !verifierMatches(parsed.data.verifier, stored.challenge)) {
    return Response.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }
  const res = await auth.api.verifyOneTimeToken({
    body: { token: stored.ott },
    headers: req.headers,
    asResponse: true,
  });
  if (!res.ok) return Response.json({ ok: false, error: "EXPIRED" }, { status: 400 });
  const out = Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  for (const c of res.headers.getSetCookie()) out.headers.append("Set-Cookie", c);
  return out;
}

/**
 * Página mínima que devolve a pessoa ao app pelo link br.app.bubbly://auth (redirecionar direto para um esquema
 * próprio é bloqueado em alguns navegadores sem um toque). Também apaga a sessão e o challenge deste navegador.
 */
function backToApp(result: { code: string } | { error: string }, req?: Request): Response {
  const href = returnUrl(result);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Bubbly</title>
<style>html,body{margin:0;height:100%;background:#F8F7FC;font-family:-apple-system,system-ui,Roboto,sans-serif;color:#2A2140}
main{min-height:100%;display:grid;place-items:center;text-align:center;padding:24px;box-sizing:border-box}
a{display:inline-block;margin-top:16px;font-size:16px;font-weight:600;color:#fff;background:#6D4AFF;border-radius:14px;padding:14px 28px;text-decoration:none}</style>
</head><body><main><div><p>Voltando para o Bubbly…</p><a href="${href}">Abrir o app</a></div></main>
<script>location.replace(${JSON.stringify(href)});</script></body></html>`;
  const res = new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
  res.headers.append("Set-Cookie", `${CHALLENGE_COOKIE}=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  for (const name of req ? cookieNames(req) : []) {
    if (name.includes("better-auth"))
      res.headers.append("Set-Cookie", `${name}=; Path=/; Max-Age=0; Secure; SameSite=Lax`);
  }
  return res;
}
