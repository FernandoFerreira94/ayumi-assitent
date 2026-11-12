import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

/**
 * Volta do Google (/callback/*): quando o Better Auth recusa a entrada (ex.: e-mail fora de ALLOWED_EMAILS,
 * barrado em databaseHooks), ele responde JSON e o celular mostrava {"message":"NOT_ALLOWED"} cru.
 * Aqui a pessoa volta para o /login, que mostra o motivo em português.
 */
export async function GET(req: Request) {
  const res = await handlers.GET(req);
  const url = new URL(req.url);
  if (!url.pathname.includes("/callback/") || res.status < 400) return res;
  let code = "UNKNOWN";
  try {
    const body = (await res.clone().json()) as { message?: unknown; code?: unknown };
    const raw = typeof body.message === "string" ? body.message : body.code;
    if (typeof raw === "string" && /^[A-Za-z_]{1,60}$/.test(raw)) code = raw;
  } catch {
    // corpo sem JSON: segue com UNKNOWN
  }
  const back = new URL("/login", process.env.BETTER_AUTH_URL || url.origin);
  back.searchParams.set("error", code);
  return Response.redirect(back, 302);
}

export const { POST } = handlers;
