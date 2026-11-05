import { inArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { clients } from "@/db/schema";
import type { Candidate } from "./parse";

export type Preview = (Candidate & { exists: boolean })[];

/** Marca quem já está cadastrada (mesmo telefone no estúdio). */
export async function markExisting(tx: Tx, list: Candidate[]): Promise<Preview> {
  if (list.length === 0) return [];
  const rows = await tx
    .select({ p: clients.phoneE164 })
    .from(clients)
    .where(
      inArray(
        clients.phoneE164,
        list.map((c) => c.phone),
      ),
    );
  const have = new Set(rows.map((r) => r.p));
  return list.map((c) => ({ ...c, exists: have.has(c.phone) }));
}

/** Insere em lote; telefones repetidos são ignorados sem erro. */
export async function importClients(tx: Tx, tenantId: string, list: Candidate[]) {
  if (list.length === 0) return { created: 0, skipped: 0 };
  const rows = await tx
    .insert(clients)
    .values(list.map((c) => ({ tenantId, name: c.name, phoneE164: c.phone, email: c.email })))
    .onConflictDoNothing()
    .returning({ id: clients.id });
  return { created: rows.length, skipped: list.length - rows.length };
}
