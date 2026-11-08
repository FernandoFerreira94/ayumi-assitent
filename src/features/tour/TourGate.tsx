import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/session";
import { Tour } from "./Tour";

/** Monta o tour sempre (Ajustes pode reabrir); abre sozinho só se a conta ainda não viu. */
export async function TourGate() {
  const session = await getSession();
  if (!session) return null;
  const rows = await getDb().execute<{ seen: boolean }>(
    sql`select tour_done_at is not null as seen from memberships where user_id = ${session.user.id} limit 1`,
  );
  return <Tour autoStart={rows[0]?.seen === false} />;
}
