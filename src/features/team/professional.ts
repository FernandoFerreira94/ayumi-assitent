import { asc, sql } from "drizzle-orm";
import { withTenant, type Tx } from "@/db/client";
import { professionals } from "@/db/schema";

/**
 * Profissional padrão do salão: a primeira por posição. Se o salão ainda não tem nenhuma,
 * o banco cria uma (função `default_professional_id`, a mesma que a trigger usa), então nunca é null.
 * Enquanto as telas não escolhem profissional, é quem recebe agenda, bloqueios e expediente.
 */
export async function defaultProfessionalId(tx: Tx, tenantId: string): Promise<string> {
  const rows = await tx.execute<{ id: string }>(sql`select default_professional_id(${tenantId}::uuid) as id`);
  return rows[0]!.id;
}

/**
 * Só leitura: a primeira profissional do salão ativo (o RLS limita ao salão), ou null se ainda não há.
 * Quem lê expediente/listas não precisa criar nada: sem profissional, não há o que mostrar.
 */
export async function firstProfessionalId(tx: Tx): Promise<string | null> {
  const [row] = await tx
    .select({ id: professionals.id })
    .from(professionals)
    .orderBy(asc(professionals.position), asc(professionals.createdAt))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Profissional cuja agenda de fora (Google, link do iPhone, iCloud) o login gerencia: a ligada ao login;
 * owner/admin sem profissional ligada usam a padrão do salão, como nas demais telas.
 */
export async function calendarProfessionalId(actor: {
  tenantId: string;
  professionalId: string | null;
}): Promise<string> {
  if (actor.professionalId) return actor.professionalId;
  return withTenant(actor.tenantId, (tx) => defaultProfessionalId(tx, actor.tenantId));
}
