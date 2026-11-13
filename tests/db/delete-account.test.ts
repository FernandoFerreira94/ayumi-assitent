// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("excluir minha conta (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let deleteAccountData: typeof import("@/features/salon/delete-account").deleteAccountData;

  const seed = async (uid: string, instance: string | null) => {
    await admin`insert into "user" (id, name, email) values (${uid}, ${uid}, ${uid + "@t.test"})`;
    await admin`insert into session (id, "expiresAt", token, "userId") values (${uid + "-s"}, now() + interval '1 day', ${uid + "-tok"}, ${uid})`;
    const [{ id }] = await admin`insert into tenants (name, whatsapp_instance) values (${uid}, ${instance}) returning id`;
    await admin`insert into memberships (user_id, tenant_id, role) values (${uid}, ${id}, 'owner')`;
    await admin`insert into clients (tenant_id, name, phone_e164) values (${id}, 'Cli', '+5511900000000')`;
    return id as string;
  };

  beforeAll(async () => {
    ({ deleteAccountData } = await import("@/features/salon/delete-account"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    await admin`delete from "user" where id in ('del-a', 'del-b')`;
  });
  afterAll(async () => admin.end());

  it("apaga o estúdio e o usuário, desconecta WhatsApp e Google, e não toca no outro estúdio", async () => {
    const A = await seed("del-a", "studio-a");
    const B = await seed("del-b", "studio-b");
    const removed: string[] = [];
    const revoked: string[] = [];
    await deleteAccountData("del-a", {
      revokeGoogle: async (u) => void revoked.push(u),
      removeInstance: async (i) => void removed.push(i),
    });
    expect(revoked).toEqual(["del-a"]);
    expect(removed).toEqual(["studio-a"]);
    expect(await admin`select id from tenants where id = ${A}`).toHaveLength(0);
    expect(await admin`select id from clients where tenant_id = ${A}`).toHaveLength(0);
    expect(await admin`select id from "user" where id = 'del-a'`).toHaveLength(0);
    expect(await admin`select id from session where "userId" = 'del-a'`).toHaveLength(0);
    expect(await admin`select id from tenants where id = ${B}`).toHaveLength(1);
    expect(await admin`select id from clients where tenant_id = ${B}`).toHaveLength(1);
  });

  it("falha no WhatsApp ou no Google não impede apagar os dados", async () => {
    await admin`truncate tenants cascade`;
    await seed("del-a", "studio-a");
    await deleteAccountData("del-a", {
      revokeGoogle: async () => {
        throw new Error("rede");
      },
      removeInstance: async () => {
        throw new Error("evolution fora");
      },
    });
    expect(await admin`select id from "user" where id = 'del-a'`).toHaveLength(0);
  });
});
