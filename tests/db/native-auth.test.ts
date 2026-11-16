// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertTestDatabase } from "../db-guard";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

// Fluxo real do Better Auth (sem Google): a sessão "do navegador" vem de um login por senha; o resto é o handoff.
const USER = "native-auth-u";
const EMAIL = "native@t.test";
const PASS = "senha-forte-123";
const VERIFIER = "v".repeat(43);

function cookieHeader(setCookies: string[]): string {
  return setCookies
    .map((c) => c.split(";")[0])
    .filter((c) => !c.endsWith("="))
    .join("; ");
}

d("login do Google no app da loja: troca de sessão (Postgres real)", () => {
  let db: ReturnType<typeof postgres>;
  let auth: typeof import("@/lib/auth").auth;
  let handoff: typeof import("@/features/native/handoff");
  let core: typeof import("@/features/native/handoff-core");
  let browserCookie = "";

  beforeAll(async () => {
    assertTestDatabase();
    process.env.BETTER_AUTH_SECRET ||= "segredo-de-teste-com-mais-de-32-caracteres!!";
    process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
    process.env.ALLOWED_EMAILS = EMAIL;
    process.env.GOOGLE_CLIENT_ID ||= "teste.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET ||= "segredo-teste";
    db = postgres(url!, { max: 1, onnotice: () => {} });
    ({ auth } = await import("@/lib/auth"));
    handoff = await import("@/features/native/handoff");
    core = await import("@/features/native/handoff-core");
    await db`delete from "user" where id = ${USER}`;
    await db`insert into "user" (id, name, email, "emailVerified") values (${USER}, 'App', ${EMAIL}, true)`;
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(PASS);
    await db`insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
             values ('native-auth-acc', ${USER}, 'credential', ${USER}, ${hash}, now(), now())`;
    const res = await auth.api.signInEmail({ body: { email: EMAIL, password: PASS }, asResponse: true });
    expect(res.ok).toBe(true);
    browserCookie = cookieHeader(res.headers.getSetCookie());
  });
  afterAll(async () => {
    await db`delete from "user" where id = ${USER}`;
    await db.end();
  });

  async function finish(challenge: string) {
    const req = new Request("http://localhost:3000/api/native-auth/finish", {
      headers: { cookie: `${browserCookie}; ${core.CHALLENGE_COOKIE}=${challenge}` },
    });
    const res = await handoff.finishNativeGoogle(req);
    const html = await res.text();
    const code = /br\.app\.bubbly:\/\/auth\?code=([A-Za-z0-9_-]+)/.exec(html)?.[1];
    return { res, html, code };
  }

  function exchange(code: string, verifier: string) {
    return handoff.exchangeNativeCode(
      new Request("http://localhost:3000/api/native-auth/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, verifier }),
      }),
    );
  }

  it("código + segredo certo abrem a sessão na WebView; o navegador esquece a dele", async () => {
    const { res, code } = await finish(core.challengeOf(VERIFIER));
    expect(code).toBeTruthy();
    // navegador do sistema: cookies do Better Auth e o challenge apagados
    const cleared = res.headers.getSetCookie().join("\n");
    expect(cleared).toContain(`${core.CHALLENGE_COOKIE}=; Path=/api; Max-Age=0`);
    expect(cleared).toMatch(/better-auth\.session_token=; Path=\/; Max-Age=0/);

    const out = await exchange(code!, VERIFIER);
    expect(out.status).toBe(200);
    const appCookie = cookieHeader(out.headers.getSetCookie());
    const session = await auth.api.getSession({ headers: new Headers({ cookie: appCookie }) });
    expect(session?.user.id).toBe(USER);

    // código de uso único: a segunda troca falha
    expect((await exchange(code!, VERIFIER)).status).toBe(400);
  });

  it("segredo errado não abre sessão e queima o código", async () => {
    const { code } = await finish(core.challengeOf(VERIFIER));
    expect((await exchange(code!, "w".repeat(43))).status).toBe(400);
    expect((await exchange(code!, VERIFIER)).status).toBe(400);
  });

  it("sem challenge ou sem sessão volta ao app com erro", async () => {
    const noChallenge = await handoff.finishNativeGoogle(
      new Request("http://localhost:3000/api/native-auth/finish", { headers: { cookie: browserCookie } }),
    );
    expect(await noChallenge.text()).toContain("br.app.bubbly://auth?error=INVALID_REQUEST");
    const noSession = await handoff.finishNativeGoogle(
      new Request("http://localhost:3000/api/native-auth/finish", {
        headers: { cookie: `${core.CHALLENGE_COOKIE}=${core.challengeOf(VERIFIER)}` },
      }),
    );
    expect(await noSession.text()).toContain("br.app.bubbly://auth?error=UNKNOWN");
  });

  it("início: guarda o challenge num cookie curto e manda para o Google", async () => {
    const ok = await handoff.startNativeGoogle(
      new Request(`http://localhost:3000/api/native-auth/start?challenge=${core.challengeOf(VERIFIER)}`),
    );
    expect(ok.status).toBe(302);
    expect(ok.headers.get("Location")).toMatch(/^https:\/\/accounts\.google\.com\//);
    expect(ok.headers.getSetCookie().join("\n")).toContain(`${core.CHALLENGE_COOKIE}=${core.challengeOf(VERIFIER)}`);
    const bad = await handoff.startNativeGoogle(new Request("http://localhost:3000/api/native-auth/start?challenge=x"));
    expect(await bad.text()).toContain("br.app.bubbly://auth?error=INVALID_REQUEST");
  });

  it("no endereço antigo do Railway, manda o início para o domínio oficial (o Google volta para lá)", async () => {
    const path = `/api/native-auth/start?challenge=${core.challengeOf(VERIFIER)}`;
    const res = await handoff.startNativeGoogle(
      new Request(`https://ayumi-assitent-production.up.railway.app${path}`, {
        headers: { host: "ayumi-assitent-production.up.railway.app" },
      }),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(new URL(path, process.env.BETTER_AUTH_URL).toString());
  });

  it("as rotas de token de uso único não existem pela rede", async () => {
    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/one-time-token/generate", { headers: { cookie: browserCookie } }),
    );
    expect(res.status).toBe(404);
    const verify = await auth.handler(
      new Request("http://localhost:3000/api/auth/one-time-token/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({ token: "qualquer" }),
      }),
    );
    expect(verify.status).toBe(404);
  });
});
