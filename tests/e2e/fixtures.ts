/* eslint-disable react-hooks/rules-of-hooks -- `use` aqui é o callback de fixture do Playwright, não um hook do React */
import { createHmac, randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";
import postgres from "postgres";
import { CURRENT_VERSION, SEEN_VERSION_KEY } from "../../src/features/update/changelog";

// Cria usuário + sessão direto no banco e injeta o cookie assinado do Better Auth.
export const test = base.extend<{ tourDone: boolean }>({
  // A maioria dos testes já entra com o tour visto; o spec do tour liga com test.use({ tourDone: false })
  tourDone: [true, { option: true }],
  context: async ({ context, tourDone }, use) => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const uid = randomUUID();
    const token = randomUUID().replace(/-/g, "");
    await sql`insert into "user" (id, name, email, "emailVerified") values (${uid}, 'E2E', ${uid + "@e2e.test"}, true)`;
    await sql`insert into session (id, "expiresAt", token, "userId") values (${randomUUID()}, now() + interval '1 day', ${token}, ${uid})`;
    const [{ id: tid }] = await sql`insert into tenants (name) values ('Estúdio E2E') returning id`;
    await sql`insert into memberships (user_id, tenant_id, tour_done_at) values (${uid}, ${tid}, ${tourDone ? new Date() : null})`;
    await sql.end();
    const sig = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(token).digest("base64");
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: encodeURIComponent(`${token}.${sig}`),
        domain: "localhost",
        path: "/",
      },
    ]);
    // O diálogo "App atualizado" abriria por cima de todos os testes: o aparelho de teste já viu a versão
    await context.addInitScript(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch {}
      },
      [SEEN_VERSION_KEY, CURRENT_VERSION] as const,
    );
    await use(context);
  },
});
export { expect };
