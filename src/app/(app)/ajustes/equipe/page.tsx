import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listPendingInvites, listProfessionals } from "@/features/team/core";
import { membersOf } from "@/features/team/membership";
import { canAs } from "@/features/team/permissions";
import { TeamList, type TeamMember } from "@/features/team/TeamList";
import { requireTenantFor } from "@/lib/tenant";

export const metadata: Metadata = { title: "Equipe" };

/** Ajustes > Equipe: profissionais do salão, quem já entra no app e os convites em aberto. Só dona e gerente. */
export default async function EquipePage() {
  const me = await requireTenantFor("/ajustes/equipe");
  if (!canAs(me, "team.manage")) redirect("/ajustes");
  const [{ pros, invites }, members] = await Promise.all([
    withTenant(me.tenantId, async (tx) => ({
      pros: await listProfessionals(tx),
      invites: await listPendingInvites(tx, new Date()),
    })),
    membersOf(me.tenantId),
  ]);
  const team: TeamMember[] = pros.map((p) => {
    const login = members.find((m) => m.professionalId === p.id);
    return {
      id: p.id,
      name: p.name,
      active: p.active,
      access: login ? (login.role === "owner" ? "owner" : "login") : null,
      invitedUntil: invites.find((i) => i.professionalId === p.id)?.expiresAt.toISOString() ?? null,
      inviteId: invites.find((i) => i.professionalId === p.id)?.id ?? null,
    };
  });
  const adminInvites = invites
    .filter((i) => i.role === "admin")
    .map((i) => ({ id: i.id, expiresAt: i.expiresAt.toISOString() }));
  const admins = members.filter((m) => m.role === "admin").length;
  return (
    <PageShell back backHref="/ajustes" title="Equipe">
      <TeamList team={team} adminInvites={adminInvites} admins={admins} canInviteAdmin={me.role === "owner"} />
    </PageShell>
  );
}
