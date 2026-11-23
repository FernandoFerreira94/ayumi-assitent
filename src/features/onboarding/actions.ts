"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireSession } from "@/lib/session";

/** Marca a entrada como feita (ou pulada) para não aparecer de novo, nem em outro aparelho. */
export async function finishOnboarding(): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await getDb().execute(
      sql`update memberships set onboarding_done_at = coalesce(onboarding_done_at, now()) where user_id = ${session.user.id}`,
    );
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
