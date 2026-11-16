import { and, asc, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { slotLists } from "@/db/schema";
import { defaultProfessionalId, firstProfessionalId } from "@/features/team/professional";
import { parseConfig, type CustomConfig, type SavedSlotList } from "./custom-slots";

/** Listas da profissional (sem `professionalId`, da profissional padrão do salão). */
export async function listSlotLists(tx: Tx, professionalId?: string): Promise<SavedSlotList[]> {
  const prof = professionalId ?? (await firstProfessionalId(tx));
  if (!prof) return [];
  const rows = await tx.select().from(slotLists).where(eq(slotLists.professionalId, prof)).orderBy(asc(slotLists.name));
  return rows.flatMap((r) => {
    const config = parseConfig(r.config);
    return config ? [{ id: r.id, name: r.name, config }] : [];
  });
}

/** "taken" quando já existe outra lista com esse nome. */
export async function saveSlotList(
  tx: Tx,
  tenantId: string,
  input: { id?: string; name: string; config: CustomConfig },
  professionalId?: string,
): Promise<{ status: "ok"; id: string } | { status: "taken" | "missing" }> {
  const prof = professionalId ?? (await defaultProfessionalId(tx, tenantId));
  const dup = await tx
    .select({ id: slotLists.id })
    .from(slotLists)
    .where(and(eq(slotLists.professionalId, prof), eq(slotLists.name, input.name)));
  if (dup.some((d) => d.id !== input.id)) return { status: "taken" };
  if (input.id) {
    const rows = await tx
      .update(slotLists)
      .set({ name: input.name, config: input.config })
      .where(eq(slotLists.id, input.id))
      .returning({ id: slotLists.id });
    return rows.length ? { status: "ok", id: input.id } : { status: "missing" };
  }
  const [row] = await tx
    .insert(slotLists)
    .values({ tenantId, professionalId: prof, name: input.name, config: input.config })
    .returning({ id: slotLists.id });
  return { status: "ok", id: row.id };
}

export async function removeSlotList(tx: Tx, id: string) {
  await tx.delete(slotLists).where(eq(slotLists.id, id));
}
