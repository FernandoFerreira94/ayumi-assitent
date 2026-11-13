import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

export type DeleteDeps = {
  revokeGoogle: (userId: string) => Promise<void>;
  removeInstance: (instance: string) => Promise<void>;
};

/** Texto que a pessoa digita para confirmar (botão só libera com ele). */
export const DELETE_CONFIRM = "EXCLUIR";

/**
 * Exclui a conta (LGPD): revoga o Google, apaga a instância do WhatsApp e apaga os estúdios de que a pessoa
 * é dona (cascata leva clientes, agenda, conversas, despesas, avisos e push) e o usuário (sessões e logins).
 * Roda como dono do banco: apaga tenants e o usuário, que o papel do app não pode apagar.
 */
export async function deleteAccountData(userId: string, deps: DeleteDeps): Promise<void> {
  const db = getDb();
  const owned = await db.execute<{ id: string; instance: string | null }>(sql`
    select t.id, t.whatsapp_instance as instance from tenants t
    join memberships m on m.tenant_id = t.id
    where m.user_id = ${userId} and m.role = 'owner'`);
  // Fora do banco primeiro; falha aqui não impede apagar os dados
  await deps.revokeGoogle(userId).catch(() => undefined);
  for (const t of owned) if (t.instance) await deps.removeInstance(t.instance).catch(() => undefined);
  await db.transaction(async (tx) => {
    for (const t of owned) await tx.execute(sql`delete from tenants where id = ${t.id}`);
    await tx.execute(sql`delete from "user" where id = ${userId}`);
  });
}
