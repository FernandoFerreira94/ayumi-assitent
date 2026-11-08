"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireSession } from "@/lib/session";

/** Marca o tour como visto para não reaparecer, nem em outro aparelho. */
export async function finishTour(): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await getDb().execute(sql`update memberships set tour_done_at = now() where user_id = ${session.user.id}`);
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
