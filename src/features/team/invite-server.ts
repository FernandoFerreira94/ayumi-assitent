import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { hashInviteToken, isInviteToken, type InviteState } from "./invite";

export type InvitePreview = {
  salon: string;
  role: "admin" | "professional";
  professionalName: string | null;
  state: Exclude<InviteState, "invalid">;
};

/**
 * O que a página pública do convite mostra. Roda sem salão ativo (a pessoa nem tem conta): lê pela função
 * `team_invite_preview` (SECURITY DEFINER), que devolve só nome do salão, papel, nome da profissional e estado.
 */
export async function teamInvitePreview(token: string): Promise<InvitePreview | null> {
  if (!isInviteToken(token)) return null;
  const rows = await getDb().execute<{
    tenant_name: string;
    role: InvitePreview["role"];
    professional_name: string | null;
    state: InvitePreview["state"];
  }>(sql`select * from team_invite_preview(${hashInviteToken(token)})`);
  const r = rows[0];
  return r ? { salon: r.tenant_name, role: r.role, professionalName: r.professional_name, state: r.state } : null;
}
