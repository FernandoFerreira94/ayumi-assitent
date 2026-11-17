"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { syncAppointmentSafe } from "@/features/google/server";
import {
  activateProfessional,
  createInvite,
  createProfessional,
  deactivateProfessional,
  revokeInvite,
  updateProfessional,
} from "./core";
import {
  INVITE_COOKIE,
  INVITE_COOKIE_MAX_AGE,
  inviteMessage,
  inviteUrl,
  inviteWhatsappUrl,
  isInviteToken,
} from "./invite";
import { membersOf } from "./membership";
import { canAs } from "./permissions";
import { teamInvitePreview } from "./invite-server";

const nameSchema = z.object({ name: z.string().trim().min(2).max(60) });
const idSchema = z.string().uuid();

async function baseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

/** Só quem gerencia a equipe (dona e gerente). Devolve o login ou null. */
async function manager() {
  const me = await requireTenant();
  return canAs(me, "team.manage") ? me : null;
}

function refresh() {
  revalidatePath("/ajustes", "layout");
  revalidatePath("/agenda");
  revalidatePath("/calendario");
}

export async function addProfessional(input: { name: string }): Promise<ActionResult<{ id: string }>> {
  const p = nameSchema.safeParse(input);
  if (!p.success) return fail("VALIDATION", "name");
  const me = await manager();
  if (!me) return fail("FORBIDDEN");
  try {
    const res = await withTenant(me.tenantId, (tx) => createProfessional(tx, me.tenantId, { name: p.data.name }));
    if (res.ok) refresh();
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function renameProfessional(id: string, input: { name: string }): Promise<ActionResult> {
  const p = nameSchema.safeParse(input);
  if (!p.success || !idSchema.safeParse(id).success) return fail("VALIDATION", "name");
  const me = await manager();
  if (!me) return fail("FORBIDDEN");
  try {
    const res = await withTenant(me.tenantId, (tx) => updateProfessional(tx, id, { name: p.data.name }));
    if (res.ok) refresh();
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function reactivateProfessional(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("VALIDATION");
  const me = await manager();
  if (!me) return fail("FORBIDDEN");
  try {
    const res = await withTenant(me.tenantId, (tx) => activateProfessional(tx, me.tenantId, id));
    if (res.ok) refresh();
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

const planSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("cancel") }),
  z.object({ kind: z.literal("reassign"), toProfessionalId: z.string().uuid() }),
]);

/** Desativa. Com atendimentos futuros, o plano diz se passam para outra profissional ou são cancelados. */
export async function removeProfessional(
  id: string,
  plan: z.input<typeof planSchema> = { kind: "none" },
): Promise<ActionResult> {
  const pl = planSchema.safeParse(plan);
  if (!pl.success || !idSchema.safeParse(id).success) return fail("VALIDATION");
  const me = await manager();
  if (!me) return fail("FORBIDDEN");
  try {
    const res = await withTenant(me.tenantId, (tx) => deactivateProfessional(tx, id, pl.data, new Date()));
    if (!res.ok) return res;
    // Google: cada atendimento mexido atualiza (ou sai) na agenda da profissional dona dele; falha não desfaz
    for (const apptId of res.data.touched) await syncAppointmentSafe(me.tenantId, apptId);
    refresh();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export type InviteLink = { url: string; whatsappUrl: string; message: string; expiresAt: string };

const inviteSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("professional"), professionalId: z.string().uuid() }),
  z.object({ role: z.literal("admin") }),
]);

/** Gera o link de convite (vale 7 dias). O link só aparece agora: o banco guarda só o hash. */
export async function inviteMember(
  input: z.input<typeof inviteSchema>,
  personName?: string,
): Promise<ActionResult<InviteLink>> {
  const p = inviteSchema.safeParse(input);
  if (!p.success) return fail("VALIDATION");
  const me = await manager();
  // Convidar gerente é coisa da dona
  if (!me || (p.data.role === "admin" && me.role !== "owner")) return fail("FORBIDDEN");
  try {
    const now = new Date();
    const members = await membersOf(me.tenantId);
    const target = p.data;
    const hasLogin = target.role === "professional" && members.some((m) => m.professionalId === target.professionalId);
    const res = await withTenant(me.tenantId, (tx) =>
      createInvite(tx, me.tenantId, me.userId, p.data, hasLogin, now),
    );
    if (!res.ok) return res;
    const salon = (await salonName(me.tenantId)) ?? "salão";
    const url = inviteUrl(await baseUrl(), res.data.token);
    const message = inviteMessage(url, salon, personName);
    revalidatePath("/ajustes/equipe");
    return ok({ url, message, whatsappUrl: inviteWhatsappUrl(message), expiresAt: res.data.expiresAt.toISOString() });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function cancelInvite(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("VALIDATION");
  const me = await manager();
  if (!me) return fail("FORBIDDEN");
  try {
    const res = await withTenant(me.tenantId, (tx) => revokeInvite(tx, id));
    if (res.ok) revalidatePath("/ajustes/equipe");
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

/**
 * Página pública do convite: guarda o token num cookie httpOnly de 1 hora para o cadastro com o Google ler.
 * Convite que não vale (inexistente, expirado, usado) nem chega ao Google.
 */
export async function startInvite(token: string): Promise<ActionResult> {
  if (!isInviteToken(token)) return fail("INVITE_INVALID");
  const prev = await teamInvitePreview(token);
  if (!prev) return fail("INVITE_INVALID");
  if (prev.state === "expired") return fail("INVITE_EXPIRED");
  if (prev.state === "used") return fail("INVITE_USED");
  (await cookies()).set(INVITE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_COOKIE_MAX_AGE,
  });
  return ok();
}

async function salonName(tenantId: string): Promise<string | null> {
  const [t] = await getDb().select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId));
  return t?.name ?? null;
}
