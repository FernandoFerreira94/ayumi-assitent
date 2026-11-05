/* eslint-disable react-hooks/rules-of-hooks -- `use` aqui é o callback de fixture do Playwright, não um hook do React */
import { createHmac, randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";
import postgres from "postgres";

// Cria usuário + sessão direto no banco e injeta o cookie assinado do Better Auth.
export const test = base.extend({
  context: async ({ context }, use) => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const uid = randomUUID();
    const token = randomUUID().replace(/-/g, "");
    await sql`insert into "user" (id, name, email, "emailVerified") values (${uid}, 'E2E', ${uid + "@e2e.test"}, true)`;
    await sql`insert into session (id, "expiresAt", token, "userId") values (${randomUUID()}, now() + interval '1 day', ${token}, ${uid})`;
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
    await use(context);
  },
});
export { expect };
