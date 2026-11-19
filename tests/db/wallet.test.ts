// @vitest-environment node
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("carteira da cliente (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, T2: string, svc: string, cli: string, cli2: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/appointments/core");
  let wallet: typeof import("@/features/wallet/core");
  let clients: typeof import("@/features/clients/core");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/appointments/core");
    wallet = await import("@/features/wallet/core");
    clients = await import("@/features/clients/core");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio Carteira') returning id`;
    [{ id: T2 }] = await admin`insert into tenants (name) values ('Outro') returning id`;
    [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Unha',60,5000) returning id`;
    [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511977773333') returning id`;
    [{ id: cli2 }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T2},'Bia','+5511977774444') returning id`;
  });
  afterAll(async () => admin.end());

  const ledger = (appointmentId: string) =>
    admin`select kind, amount_cents, method, reverses_id from client_ledger where appointment_id = ${appointmentId} order by created_at, amount_cents desc`;

  let hour = 9;
  const book = (payment?: { method: "pix" | "dinheiro" | null } | null) =>
    withTenant(T, (tx) =>
      core.insertAppointment(tx, T, {
        clientId: cli,
        serviceIds: [svc],
        date: "2030-06-10",
        time: `${String(hour++).padStart(2, "0")}:00`,
        payment,
      }),
    );

  it("agendar já pago grava um pagamento do total no extrato", async () => {
    const r = await book({ method: "pix" });
    if (!r.ok) throw new Error(r.code);
    expect(await ledger(r.data.id)).toMatchObject([{ kind: "payment", amount_cents: 5000, method: "pix" }]);
  });

  it("marcar, trocar a forma e desmarcar só acrescentam linhas (nada é apagado)", async () => {
    const r = await book(null);
    if (!r.ok) throw new Error(r.code);
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: "dinheiro" }));
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: "pix" }));
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, null));
    const rows = await ledger(r.data.id);
    expect(rows).toHaveLength(4);
    expect(rows.reduce((s, x) => s + x.amount_cents, 0)).toBe(0);
    expect(rows.filter((x) => x.reverses_id)).toHaveLength(2);
    // desmarcar de novo não grava nada
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, null));
    expect(await ledger(r.data.id)).toHaveLength(4);
  });

  it("o app não edita nem apaga movimento", async () => {
    const r = await book({ method: null });
    if (!r.ok) throw new Error(r.code);
    await expect(
      withTenant(T, (tx) =>
        tx.execute(sql`update client_ledger set amount_cents = 1 where appointment_id = ${r.data.id}`),
      ),
    ).rejects.toThrow();
    await expect(
      withTenant(T, (tx) => tx.execute(sql`delete from client_ledger where appointment_id = ${r.data.id}`)),
    ).rejects.toThrow();
    expect(await ledger(r.data.id)).toHaveLength(1);
  });

  it("outro estúdio não vê nem lança na carteira (RLS e chave composta)", async () => {
    const seen = await withTenant(T2, (tx) => wallet.clientMoves(tx, cli));
    expect(seen).toHaveLength(0);
    await expect(
      withTenant(T2, (tx) =>
        wallet.recordPayment(tx, { tenantId: T, clientId: cli, appointmentId: null, amountCents: 100, method: null }),
      ),
    ).rejects.toThrow();
    // Mesmo o dono do banco não liga movimento a cliente de outro estúdio
    await expect(
      admin`insert into client_ledger (tenant_id, client_id, kind, amount_cents) values (${T}, ${cli2}, 'payment', 100)`,
    ).rejects.toThrow();
  });

  it("valor negativo só como anulação", async () => {
    await expect(
      admin`insert into client_ledger (tenant_id, client_id, kind, amount_cents) values (${T}, ${cli}, 'payment', -100)`,
    ).rejects.toThrow();
  });

  it("cliente só com movimento na carteira é anonimizada, não apagada", async () => {
    const [{ id: solo }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Carla','+5511977775555') returning id`;
    await withTenant(T, (tx) =>
      wallet.recordPayment(tx, { tenantId: T, clientId: solo, appointmentId: null, amountCents: 2000, method: "pix" }),
    );
    await withTenant(T, (tx) => clients.deleteClientRow(tx, solo));
    const [c] = await admin`select name, anonymized_at from clients where id = ${solo}`;
    expect(c?.name).toBe("Cliente removida");
    expect(c?.anonymized_at).toBeInstanceOf(Date);
  });

  it("política do salão: padrões aprovados e salvar pelo app", async () => {
    const s = await withTenant(T, (tx) => wallet.getWalletSettings(tx));
    expect(s).toEqual({
      depositPct: 30,
      cancelNoticeHours: 24,
      lateCancelKeepsDeposit: true,
      noShowKeepsDeposit: true,
      noShowUsesSession: true,
      packageValidDays: 90,
      pixKey: null,
    });
    await withTenant(T, (tx) => wallet.saveWalletSettings(tx, T, { ...s, depositPct: 50, pixKey: "salao@pix.com" }));
    expect(await withTenant(T, (tx) => wallet.getWalletSettings(tx))).toMatchObject({
      depositPct: 50,
      pixKey: "salao@pix.com",
    });
    // Outro estúdio não muda a política deste
    await withTenant(T2, (tx) => wallet.saveWalletSettings(tx, T, { ...s, depositPct: 10 }));
    expect((await withTenant(T, (tx) => wallet.getWalletSettings(tx))).depositPct).toBe(50);
  });
});
