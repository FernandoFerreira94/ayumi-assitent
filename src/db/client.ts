import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
const client = url ? postgres(url, { max: 10 }) : null;

export function getDb() {
  if (!client) throw new Error("DATABASE_URL não configurada");
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Executa `fn` numa transação com o estúdio ativo (RLS isola os dados). */
export async function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`set local role app_user`);
    return fn(tx);
  });
}
