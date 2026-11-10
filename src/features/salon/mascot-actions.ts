"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { isMascotKind } from "@/components/brand/mascots";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireSession } from "@/lib/session";

/** Mascote e cores da pessoa logada; vale em qualquer aparelho em que ela entrar. */
export async function saveMascot(kind: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!isMascotKind(kind)) return fail("VALIDATION", "mascot");
  try {
    await getDb().execute(sql`update memberships set mascot = ${kind} where user_id = ${session.user.id}`);
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
