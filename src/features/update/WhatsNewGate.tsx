import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/session";
import { WhatsNewDialog } from "./WhatsNewDialog";

/** Só mostra o "App atualizado" para quem já terminou o tour (quem está começando não precisa de novidades). */
export async function WhatsNewGate() {
  const session = await getSession();
  if (!session) return null;
  const rows = await getDb().execute<{ seen: boolean }>(
    sql`select tour_done_at is not null as seen from memberships where user_id = ${session.user.id} limit 1`,
  );
  return <WhatsNewDialog enabled={rows[0]?.seen === true} />;
}
