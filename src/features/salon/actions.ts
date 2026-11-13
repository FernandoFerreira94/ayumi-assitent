"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { aiSettingsInput, salonInput } from "./schema";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { revokeGoogleOfUser } from "@/features/google/server";
import { DELETE_CONFIRM, deleteAccountData } from "./delete-account";
import { asc, isNull } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { appointments, clients, expenses } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import { toCsv } from "./export-csv";

/** Dados do salão e da pessoa. O papel do app só lê `tenants`, então grava pelo dono. */
export async function saveSalon(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = salonInput.safeParse({
    name: form.get("name") ?? "",
    ownerName: form.get("ownerName") ?? "",
    businessPhone: form.get("businessPhone") ?? "",
    segments: form.getAll("segments"),
  });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    await getDb()
      .update(tenants)
      .set({
        name: p.data.name,
        ownerName: p.data.ownerName || null,
        businessPhone: p.data.businessPhone,
        segments: p.data.segments,
      })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Regras da profissional para a IA (Ajustes). A IA fica sempre ligada. */
export async function saveAiSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = aiSettingsInput.safeParse({
    aiRules: form.get("aiRules") ?? "",
  });
  if (!p.success) return fail("VALIDATION", "aiRules");
  try {
    await getDb()
      .update(tenants)
      .set({ aiEnabled: true, aiRules: p.data.aiRules || null })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Excluir minha conta (Meu perfil). Só com o texto de confirmação; depois a tela volta ao login. */
export async function deleteAccount(confirm: string): Promise<ActionResult> {
  const { userId } = await requireTenant();
  if (String(confirm ?? "").trim().toUpperCase() !== DELETE_CONFIRM) return fail("VALIDATION", "confirm");
  try {
    const admin = adminFromEnv();
    await deleteAccountData(userId, {
      revokeGoogle: revokeGoogleOfUser,
      removeInstance: async (i) => {
        if (!admin) return;
        await admin.logout(i).catch(() => undefined);
        await admin.remove(i);
      },
    });
    return ok();
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "delete_account_failed", err: e instanceof Error ? e.name : "unknown" }));
    return fail("UNKNOWN");
  }
}

export type ExportFiles = { clientes: string; agendamentos: string; despesas: string };

/** Baixar meus dados (LGPD, portabilidade): três planilhas CSV só com os dados deste estúdio. */
export async function exportMyData(): Promise<ActionResult<ExportFiles>> {
  const { tenantId } = await requireTenant();
  try {
    const data = await withTenant(tenantId, async (tx) => ({
      cli: await tx
        .select({ nome: clients.name, telefone: clients.phoneE164, email: clients.email, observacoes: clients.notes })
        .from(clients)
        .where(isNull(clients.anonymizedAt))
        .orderBy(asc(clients.name)),
      ag: await tx
        .select({
          inicio: appointments.startsAt,
          cliente: clients.name,
          servicos: serviceLabel,
          valorCentavos: appointments.priceCents,
          status: appointments.status,
        })
        .from(appointments)
        .innerJoin(clients, eq(clients.id, appointments.clientId))
        .orderBy(asc(appointments.startsAt)),
      desp: await tx
        .select({ data: expenses.spentOn, valorCentavos: expenses.amountCents, categoria: expenses.category, nota: expenses.note })
        .from(expenses)
        .orderBy(asc(expenses.spentOn)),
    }));
    const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");
    return ok({
      clientes: toCsv(data.cli),
      agendamentos: toCsv(
        data.ag.map((a) => ({
          inicio: a.inicio.toISOString(),
          cliente: a.cliente,
          servicos: a.servicos,
          valor: reais(a.valorCentavos),
          status: a.status,
        })),
      ),
      despesas: toCsv(
        data.desp.map((d) => ({ data: String(d.data), valor: reais(d.valorCentavos), categoria: d.categoria, nota: d.nota })),
      ),
    });
  } catch {
    return fail("UNKNOWN");
  }
}
