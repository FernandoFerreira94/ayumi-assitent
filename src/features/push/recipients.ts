import type { Role } from "@/features/team/permissions";

/** Login do salão como o push enxerga: quem é e qual agenda é dele (memberships). */
export type Member = { userId: string; role: Role; professionalId: string | null };

const seesSalon = (m: Member) => m.role === "owner" || m.role === "admin";

/**
 * Quem recebe o push de um atendimento: a pessoa ligada à profissional do atendimento mais dona e admin do salão.
 * Um Set, então a dona que também atende não recebe duas vezes. Profissional sem login: só dona/admin.
 */
export function appointmentRecipients(members: readonly Member[], professionalId: string | null): Set<string> {
  const ids = new Set<string>();
  for (const m of members) {
    if (seesSalon(m) || (professionalId !== null && m.professionalId === professionalId)) ids.add(m.userId);
  }
  return ids;
}

/** De quem é a agenda que o aviso do dia resume: null = o salão todo. */
export type NoticeScope = { professionalId: string | null };

/**
 * Recorte do aviso do dia (D5): owner/admin veem o salão; profissional vê só a própria agenda.
 * Profissional sem agenda ligada ao login não tem o que resumir (null).
 */
export function noticeScope(m: Member): NoticeScope | null {
  if (seesSalon(m)) return { professionalId: null };
  return m.professionalId ? { professionalId: m.professionalId } : null;
}
