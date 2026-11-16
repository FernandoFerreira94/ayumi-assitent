import "server-only";
import { APIError, betterAuth } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { Pool } from "pg";
import { isPlatformAdmin } from "@/features/admin/access";
import { isEmailAllowed } from "./allowed-emails";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function alertSignup() {
  try {
    const [{ pushFromEnv }, { notifyAdmins }, { signupAlert }] = await Promise.all([
      import("@/features/push/webpush"),
      import("@/features/admin/alerts"),
      import("@/features/admin/alerts-text"),
    ]);
    const push = pushFromEnv();
    if (push) await notifyAdmins(push, signupAlert());
  } catch {
    // aviso é extra: falhar aqui não pode afetar o primeiro acesso
  }
}

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // E-mail e senha só para ENTRAR: conta nova nasce pelo Google (e-mail verificado por ele). Sem verificação de
  // e-mail, cadastro por senha deixaria alguém criar conta com o e-mail de outra pessoa e manter acesso depois
  // que ela entrasse pelo Google. A senha é criada em Ajustes > Calendários (setPassword) por quem já entrou.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
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
  // Tokens do Google cifrados no banco (quem lê direto por SQL usa features/google/token-crypto)
  account: { encryptOAuthTokens: true, accountLinking: { allowDifferentEmails: true } },
  // Railway repassa o IP real em x-forwarded-for; sem isso o limite de requisições vira um balde único para todos.
  advanced: { ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] } },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  databaseHooks: {
    // Registro de acesso (Marco Civil, 6 meses): cada login vira uma linha; limpeza em features/retention
    session: {
      create: {
        after: async (s) => {
          await pool
            .query("insert into access_log (user_id, ip, user_agent) values ($1, $2, $3)", [
              s.userId,
              s.ipAddress ?? null,
              s.userAgent ?? null,
            ])
            .catch(() => undefined);
        },
      },
    },
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
            // Aviso no celular do dono do produto (sem nome: o texto passa pela Apple/Google). Nunca derruba o cadastro.
            void alertSignup();
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
  // 2FA só existe para o painel do dono (ADMIN_USER_IDS). Sem sessão, só as rotas de conferir o código do login por
  // senha ficam abertas (quem chega nelas já passou pela senha e tem o cookie de 2FA assinado).
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!ctx.path.startsWith("/two-factor/")) return;
      const session = await getSessionFromCtx(ctx);
      if (session) {
        if (!isPlatformAdmin(session.user.id)) throw new APIError("NOT_FOUND");
        return;
      }
      if (ctx.path !== "/two-factor/verify-totp" && ctx.path !== "/two-factor/verify-backup-code") {
        throw new APIError("UNAUTHORIZED");
      }
    }),
  },
  plugins: [
    // Painel do dono: TOTP no app autenticador + 10 códigos de recuperação. Quem entrou pelo Google não tem senha,
    // por isso allowPasswordless (quem tem senha continua tendo que digitá-la para ativar ou gerar códigos).
    twoFactor({ issuer: "Bubbly Admin", allowPasswordless: true }),
    nextCookies(),
  ],
});
