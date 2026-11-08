import "server-only";
import { APIError, betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { isEmailAllowed } from "./allowed-emails";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // E-mail e senha (cadastro só para e-mails autorizados: barrado em databaseHooks.user.create.before)
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Agenda do Google: lê/escreve eventos; refresh token para sincronizar em segundo plano.
      scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/contacts.readonly"],
      accessType: "offline",
      prompt: "consent",
    },
  },
  // A agenda do estúdio pode estar num Gmail diferente do e-mail de login (Conectar em Ajustes).
  // Ligar exige sessão aberta, então isso não abre entrada nova na conta.
  account: { accountLinking: { allowDifferentEmails: true } },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isEmailAllowed(user.email)) {
            throw new APIError("FORBIDDEN", { message: "NOT_ALLOWED" });
          }
        },
        after: async (user) => {
          // Primeiro acesso: cria o estúdio do usuário e o vínculo de dono.
          const client = await pool.connect();
          try {
            await client.query("begin");
            const t = await client.query("insert into tenants (name) values ($1) returning id", [
              `Estúdio de ${user.name}`,
            ]);
            await client.query("insert into memberships (user_id, tenant_id, role) values ($1, $2, 'owner')", [
              user.id,
              t.rows[0].id,
            ]);
            await client.query("commit");
          } catch (e) {
            await client.query("rollback");
            throw e;
          } finally {
            client.release();
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});
