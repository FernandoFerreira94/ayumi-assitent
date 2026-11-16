import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isPlatformAdmin } from "./access";
import { getStepUp, isStepUpFresh } from "./step-up";

const check = cache(async (stepUp: boolean) => {
  const session = await requireSession();
  const userId = session.user.id;
  if (!isPlatformAdmin(userId)) notFound();
  if (!session.user.twoFactorEnabled) redirect("/admin/ativar-2fa");
  if (stepUp) {
    const verifiedAt = await getStepUp(session.session.id);
    if (!isStepUpFresh(verifiedAt, new Date())) redirect("/admin/verificar");
  }
  return { userId, sessionId: session.session.id };
});

/**
 * Porta única do painel: toda leitura, action e rota de /admin passa por aqui. Quem não é admin vê 404.
 * `cache` evita repetir sessão e step-up quando várias leituras rodam na mesma requisição.
 */
export function requireAdmin(opts: { stepUp?: boolean } = {}): Promise<{ userId: string; sessionId: string }> {
  return check(opts.stepUp !== false);
}

/** Só para ativar o 2FA: admin logado, ainda sem 2FA (requireAdmin mandaria para a própria tela). */
export async function requireAdminWithoutTwoFactor() {
  const session = await requireSession();
  if (!isPlatformAdmin(session.user.id)) notFound();
  return { userId: session.user.id, sessionId: session.session.id, enabled: !!session.user.twoFactorEnabled };
}
