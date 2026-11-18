import "server-only";
import { cookies } from "next/headers";
import { withTenant } from "@/db/client";
import { AGENDA_FILTER_COOKIE, agendaScope, type AgendaScope } from "./agenda-scope";
import { listProfessionals } from "./core";
import type { Actor } from "./permissions";

/** Escopo da agenda do login atual: profissionais ativas do salão + filtro guardado no cookie. */
export async function loadAgendaScope(actor: Actor & { tenantId: string }): Promise<AgendaScope> {
  const requested = (await cookies()).get(AGENDA_FILTER_COOKIE)?.value;
  const all = await withTenant(actor.tenantId, (tx) => listProfessionals(tx));
  const active = all.filter((p) => p.active).map((p) => ({ id: p.id, label: p.name }));
  return agendaScope(actor, active, requested);
}
