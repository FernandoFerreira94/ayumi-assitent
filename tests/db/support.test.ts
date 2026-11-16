// @vitest-environment node
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertTestDatabase } from "../db-guard";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("suporte e avisos (Postgres real)", () => {
  let db: ReturnType<typeof postgres>;
  let core: typeof import("@/features/support/core");
  let write: typeof import("@/features/support/admin-write");
  let client: typeof import("@/db/client");
  const ANA = "sup-ana";
  const BIA = "sup-bia";
  const DONO = "sup-dono";
  let A = "";
  let B = "";

  beforeAll(async () => {
    assertTestDatabase();
    db = postgres(url!, { max: 1, onnotice: () => {} });
    core = await import("@/features/support/core");
    write = await import("@/features/support/admin-write");
    client = await import("@/db/client");
    await db`truncate tenants cascade`;
    await db`truncate platform_notices cascade`;
    await db`delete from "user" where id in (${ANA}, ${BIA}, ${DONO})`;
    await db`insert into "user" (id, name, email) values
      (${ANA}, 'Ana', 'ana-sup@t.test'), (${BIA}, 'Bia', 'bia-sup@t.test'), (${DONO}, 'Dono', 'dono-sup@t.test')`;
    [{ id: A }] = await db`insert into tenants (name) values ('Salão A') returning id`;
    [{ id: B }] = await db`insert into tenants (name) values ('Salão B') returning id`;
    await db`insert into memberships (user_id, tenant_id) values (${ANA}, ${A}), (${BIA}, ${B})`;
  });
  afterAll(async () => {
    await db`truncate tenants cascade`;
    await db`truncate platform_notices cascade`;
    await db`delete from "user" where id in (${ANA}, ${BIA}, ${DONO})`;
    await db.end();
  });

  it("o salão manda; só a primeira sem resposta avisa o dono", async () => {
    const r1 = await client.withTenant(A, (tx) => core.sendSupportMessage(tx, A, ANA, "Oi, preciso de ajuda"));
    const r2 = await client.withTenant(A, (tx) => core.sendSupportMessage(tx, A, ANA, "Mais um detalhe"));
    expect(r1).toEqual({ status: "sent", notifyAdmin: true });
    expect(r2).toEqual({ status: "sent", notifyAdmin: false });
    const msgs = await client.withTenant(A, (tx) => core.listSupportMessages(tx));
    expect(msgs.map((m) => m.body)).toEqual(["Oi, preciso de ajuda", "Mais um detalhe"]);
  });

  it("isola por salão (RLS) e o app nunca escreve como dono", async () => {
    await client.withTenant(B, (tx) => core.sendSupportMessage(tx, B, BIA, "Sou do B"));
    const seenByB = await client.withTenant(B, (tx) => core.listSupportMessages(tx));
    expect(seenByB.map((m) => m.body)).toEqual(["Sou do B"]);
    await expect(
      client.withTenant(A, (tx) => tx.execute(sql`insert into support_messages (tenant_id, author, body) values (${A}, 'admin', 'falso')`)),
    ).rejects.toThrow();
    await expect(
      client.withTenant(A, (tx) => tx.execute(sql`insert into support_messages (tenant_id, author, body) values (${B}, 'salon', 'invasão')`)),
    ).rejects.toThrow();
    // Não consegue apagar nem editar o texto
    await expect(client.withTenant(A, (tx) => tx.execute(sql`delete from support_messages`))).rejects.toThrow();
    await expect(client.withTenant(A, (tx) => tx.execute(sql`update support_messages set body = 'x'`))).rejects.toThrow();
  });

  it("resposta do dono marca o salão como lido; o salão lê e zera", async () => {
    expect(await write.insertAdminReply(A, DONO, "Oi! Já vejo para você.")).toBe(true);
    const [{ n }] = await db`select count(*)::int as n from support_messages where tenant_id = ${A} and author = 'salon' and read_at is null`;
    expect(n).toBe(0);
    expect(await client.withTenant(A, (tx) => core.unreadSupportReplies(tx))).toBe(1);
    expect(await client.withTenant(B, (tx) => core.unreadSupportReplies(tx))).toBe(0);
    await client.withTenant(A, (tx) => core.markSupportRepliesRead(tx));
    expect(await client.withTenant(A, (tx) => core.unreadSupportReplies(tx))).toBe(0);
    // Depois da resposta, a próxima mensagem do salão volta a avisar o dono
    const r = await client.withTenant(A, (tx) => core.sendSupportMessage(tx, A, ANA, "Obrigada!"));
    expect(r).toEqual({ status: "sent", notifyAdmin: true });
    expect(await write.insertAdminReply("00000000-0000-0000-0000-000000000000", DONO, "x")).toBe(false);
  });

  it("limite de mensagens por hora", async () => {
    await db`delete from support_messages where tenant_id = ${B}`;
    for (let i = 0; i < 10; i++) await client.withTenant(B, (tx) => core.sendSupportMessage(tx, B, BIA, `m${i}`));
    const r = await client.withTenant(B, (tx) => core.sendSupportMessage(tx, B, BIA, "mais uma"));
    expect(r).toEqual({ status: "rate_limited" });
  });

  it("aviso aparece para todos, some para quem fecha e quando o dono encerra", async () => {
    const id = await write.insertNotice({ title: "Manutenção", body: "Hoje às 23h", tone: "info", days: "" }, DONO);
    const imp = await write.insertNotice({ title: "Importante", body: "Leia", tone: "important", days: 1 }, DONO);
    await write.insertNotice({ title: "Vencido", body: "x", tone: "info", days: 1 }, DONO, new Date(Date.now() - 2 * 86_400_000));
    const forAna = await client.withTenant(A, (tx) => core.liveNoticesFor(tx, ANA));
    expect(forAna.map((n) => n.title)).toEqual(["Importante", "Manutenção"]);
    await client.withTenant(A, (tx) => core.dismissNotice(tx, A, ANA, id));
    await client.withTenant(A, (tx) => core.dismissNotice(tx, A, ANA, id)); // repetir não quebra
    expect((await client.withTenant(A, (tx) => core.liveNoticesFor(tx, ANA))).map((n) => n.title)).toEqual(["Importante"]);
    expect((await client.withTenant(B, (tx) => core.liveNoticesFor(tx, BIA))).map((n) => n.title)).toEqual(["Importante", "Manutenção"]);
    // Salão não grava fechamento em nome de outro salão nem cria aviso
    await expect(
      client.withTenant(A, (tx) => tx.execute(sql`insert into platform_notice_dismissals (notice_id, tenant_id, user_id) values (${imp}, ${B}, ${BIA})`)),
    ).rejects.toThrow();
    await expect(
      client.withTenant(A, (tx) => tx.execute(sql`insert into platform_notices (title, body) values ('x', 'y')`)),
    ).rejects.toThrow();
    expect(await write.endNotice(imp)).toBe(true);
    expect(await write.endNotice(imp)).toBe(false);
    // Desfazer devolve ao ar; depois encerra de novo
    expect(await write.reopenNotice(imp)).toBe(true);
    expect((await client.withTenant(B, (tx) => core.liveNoticesFor(tx, BIA))).map((n) => n.title)).toContain("Importante");
    expect(await write.endNotice(imp)).toBe(true);
    await db`update platform_notices set ended_at = now() - interval '1 hour' where id = ${imp}`;
    expect(await write.reopenNotice(imp)).toBe(false);
    expect((await client.withTenant(B, (tx) => core.liveNoticesFor(tx, BIA))).map((n) => n.title)).toEqual(["Manutenção"]);
  });
});
