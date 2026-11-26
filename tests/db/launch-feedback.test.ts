// @vitest-environment node
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertTestDatabase } from "../db-guard";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("feedback do lançamento (Postgres real)", () => {
  let db: ReturnType<typeof postgres>;
  let core: typeof import("@/features/launch/feedback-core");
  let client: typeof import("@/db/client");
  const ANA = "fb-ana";
  const BIA = "fb-bia";
  let A = "";
  let B = "";

  beforeAll(async () => {
    assertTestDatabase();
    db = postgres(url!, { max: 1, onnotice: () => {} });
    core = await import("@/features/launch/feedback-core");
    client = await import("@/db/client");
    await db`truncate tenants cascade`;
    await db`delete from "user" where id in (${ANA}, ${BIA})`;
    await db`insert into "user" (id, name, email) values (${ANA}, 'Ana', 'ana-fb@t.test'), (${BIA}, 'Bia', 'bia-fb@t.test')`;
    // A tem 10 dias de estúdio; B foi criado hoje
    [{ id: A }] = await db`insert into tenants (name, created_at) values ('Salão A', now() - interval '10 days') returning id`;
    [{ id: B }] = await db`insert into tenants (name) values ('Salão B') returning id`;
    await db`insert into memberships (user_id, tenant_id) values (${ANA}, ${A}), (${BIA}, ${B})`;
  });
  afterAll(async () => {
    await db`truncate tenants cascade`;
    await db`delete from "user" where id in (${ANA}, ${BIA})`;
    await db.end();
  });

  it("pede feedback só depois de 7 dias de estúdio", async () => {
    expect(await client.withTenant(A, (tx) => core.needsFeedback(tx, A, ANA))).toBe(true);
    expect(await client.withTenant(B, (tx) => core.needsFeedback(tx, B, BIA))).toBe(false);
  });

  it("depois de responder o cartão some, e repetir não troca a primeira resposta", async () => {
    await client.withTenant(A, (tx) => core.saveFeedback(tx, A, ANA, { helps: "Lembretes", missing: null, score: 9 }));
    await client.withTenant(A, (tx) => core.saveFeedback(tx, A, ANA, "skip"));
    expect(await client.withTenant(A, (tx) => core.needsFeedback(tx, A, ANA))).toBe(false);
    const [row] = await db`select score, skipped from launch_feedback where tenant_id = ${A} and user_id = ${ANA}`;
    expect(row).toEqual({ score: 9, skipped: false });
  });

  it("isola por salão (RLS)", async () => {
    await client.withTenant(B, (tx) => core.saveFeedback(tx, B, BIA, "skip"));
    const seenByA = await client.withTenant(A, (tx) => tx.execute<{ n: number }>(sql`select count(*)::int as n from launch_feedback`));
    expect(seenByA[0]?.n).toBe(1);
    await expect(
      client.withTenant(A, (tx) =>
        tx.execute(sql`insert into launch_feedback (tenant_id, user_id, score) values (${B}, ${ANA}, 10)`),
      ),
    ).rejects.toThrow();
  });
});
