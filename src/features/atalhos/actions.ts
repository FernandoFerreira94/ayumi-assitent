"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { apiTokens } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { MAX_ACTIVE_TOKENS, type TokenItem } from "./tokens-shared";
import { hashApiToken, newApiToken, tokenLast4 } from "./token";

/** "layout" de /ajustes: a seção e o selo da Siri na lista de Conexões. */
const PATH = "/ajustes";

/** Cria uma chave só de leitura. Ela volta só agora: o banco guarda o hash. */
export async function createApiToken(rawName: string): Promise<ActionResult<{ token: string; item: TokenItem }>> {
  const p = z.string().trim().min(1).max(40).safeParse(rawName);
  if (!p.success) return fail("VALIDATION", "name");
  const { tenantId, userId } = await requireTenant();
  try {
    const token = newApiToken();
    const res = await withTenant(tenantId, async (tx) => {
      const [{ n }] = await tx.select({ n: count() }).from(apiTokens).where(isNull(apiTokens.revokedAt));
      if (n >= MAX_ACTIVE_TOKENS) return null;
      const [row] = await tx
        .insert(apiTokens)
        .values({ tenantId, userId, name: p.data, tokenHash: hashApiToken(token), last4: tokenLast4(token) })
        .returning({ id: apiTokens.id, createdAt: apiTokens.createdAt });
      return row!;
    });
    if (!res) return fail("API_TOKEN_LIMIT");
    revalidatePath(PATH, "layout");
    return ok({
      token,
      item: {
        id: res.id,
        name: p.data,
        last4: tokenLast4(token),
        createdAt: res.createdAt.toISOString(),
        lastUsedAt: null,
      },
    });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Desliga na hora: o Atalho que usa essa chave passa a ouvir "não está mais ligado". */
export async function revokeApiToken(id: string): Promise<ActionResult> {
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  const { tenantId } = await requireTenant();
  try {
    const done = await withTenant(tenantId, (tx) =>
      tx
        .update(apiTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(apiTokens.id, p.data), isNull(apiTokens.revokedAt)))
        .returning({ id: apiTokens.id }),
    );
    if (!done.length) return fail("NOT_FOUND");
    revalidatePath(PATH, "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
