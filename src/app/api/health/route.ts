import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { errInfo, log } from "@/lib/log";

// Usado pelo healthcheck do Railway: 200 só se o banco responde.
export async function GET() {
  await connection();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (e) {
    log("error", "health_failed", errInfo(e));
    return Response.json({ ok: false }, { status: 503 });
  }
}
