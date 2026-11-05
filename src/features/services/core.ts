import { asc, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { services } from "@/db/schema";
import type { ServiceInput } from "./schema";

export const listServices = (tx: Tx) =>
  tx.select().from(services).where(eq(services.active, true)).orderBy(asc(services.name));

export async function insertService(tx: Tx, tenantId: string, input: ServiceInput) {
  const [row] = await tx
    .insert(services)
    .values({ tenantId, name: input.name, durationMin: input.durationMin, priceCents: input.price })
    .returning({ id: services.id });
  return row;
}
