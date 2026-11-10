import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Garante usuário logado; senão manda para o login (o proxy limpa o cookie vencido). */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login?sessao=invalida");
  return session;
}
