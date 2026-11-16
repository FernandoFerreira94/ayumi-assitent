import "server-only";
import { redirect } from "next/navigation";
import { membershipOf } from "@/features/team/membership";
import { requireSession } from "./session";

/**
 * Usuário logado + estúdio dele + papel (owner, admin, professional) e a profissional ligada ao login.
 * Sem vínculo, volta ao login. As actions consultam `canAs(...)` de `features/team/permissions`.
 */
export async function requireTenant() {
  const session = await requireSession();
  const m = await membershipOf(session.user.id);
  if (!m) redirect("/login?error=NOT_ALLOWED");
  return {
    userId: session.user.id,
    userName: session.user.name,
    tenantId: m.tenantId,
    role: m.role,
    professionalId: m.professionalId,
  };
}
