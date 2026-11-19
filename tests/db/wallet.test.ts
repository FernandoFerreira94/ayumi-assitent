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
  const book = (payment?: { method: "pix" | "dinheiro" | null; amountCents?: number } | null) =>
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
  const paid = async (id: string) =>
    Number(
      (
        await admin`select coalesce(sum(amount_cents), 0) as s from client_ledger where appointment_id = ${id} and kind = 'payment'`
      )[0]!.s,
    );

  it("sinal ao agendar: grava só o sinal e não marca como pago", async () => {
    const r = await book({ method: "pix", amountCents: 1500 });
    if (!r.ok) throw new Error(r.code);
    expect(await paid(r.data.id)).toBe(1500);
    const [a] = await admin`select paid_at from appointments where id = ${r.data.id}`;
    expect(a?.paid_at).toBeNull();
  });

  it("receber o resto grava só a diferença, na forma nova; baixar para sinal anula e regrava", async () => {
    const r = await book({ method: "pix", amountCents: 1500 });
    if (!r.ok) throw new Error(r.code);
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: "dinheiro" }));
    const rows = await ledger(r.data.id);
    expect(rows.map((x) => [x.amount_cents, x.method])).toEqual([
      [1500, "pix"],
      [3500, "dinheiro"],
    ]);
    const [a] = await admin`select paid_at, payment_method from appointments where id = ${r.data.id}`;
    expect(a?.paid_at).toBeInstanceOf(Date);
    expect(a?.payment_method).toBe("dinheiro");
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: null, amountCents: 2000 }));
    expect(await paid(r.data.id)).toBe(2000);
    expect((await admin`select paid_at from appointments where id = ${r.data.id}`)[0]?.paid_at).toBeNull();
  });

  it("concluir dá baixa no que faltava; desfazer anula só essa baixa", async () => {
    const r = await book({ method: "pix", amountCents: 1500 });
    if (!r.ok) throw new Error(r.code);
    await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "done"));
    expect(await paid(r.data.id)).toBe(5000);
    const auto =
      await admin`select amount_cents from client_ledger where appointment_id = ${r.data.id} and reason = 'Recebido ao concluir'`;
    expect(auto.map((x) => x.amount_cents)).toEqual([3500]);
    await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "confirmed"));
    expect(await paid(r.data.id)).toBe(1500);
    // concluir de novo grava uma baixa nova
    await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "done"));
    expect(await paid(r.data.id)).toBe(5000);
  });

  it("listDay traz o pago do extrato e o caixa soma pagamentos menos devoluções no período", async () => {
    const r = await book({ method: "pix", amountCents: 1500 });
    if (!r.ok) throw new Error(r.code);
    const day = await withTenant(T, (tx) =>
      core.listDay(tx, [new Date("2030-06-10T00:00:00Z"), new Date("2030-06-11T12:00:00Z")]),
    );
    expect(day.find((x) => x.id === r.data.id)?.paidCents).toBe(1500);
    const now = Date.now();
    const range: [Date, Date] = [new Date(now - 3_600_000), new Date(now + 3_600_000)];
    const before = await withTenant(T, (tx) => wallet.cashInRange(tx, range));
    await admin`insert into client_ledger (tenant_id, client_id, kind, amount_cents) values (${T}, ${cli}, 'refund', 500)`;
    expect(await withTenant(T, (tx) => wallet.cashInRange(tx, range))).toBe(before - 500);
    expect(await withTenant(T2, (tx) => wallet.cashInRange(tx, range))).toBe(0);
  });

  describe("cancelar, faltar, crédito e devolver (PR 3)", () => {
    let carla: string;
    let h = 8;
    const at = (date: string, time: string) => new Date(`${date}T${time}:00-03:00`);
    const bookC = (date: string, payment?: { method: "pix" | null; amountCents?: number } | null) =>
      withTenant(T, (tx) =>
        core.insertAppointment(tx, T, {
          clientId: carla,
          serviceIds: [svc],
          date,
          time: `${String(h++).padStart(2, "0")}:00`,
          payment,
        }),
      );
    const balance = () => withTenant(T, (tx) => wallet.clientBalance(tx, carla));

    beforeAll(async () => {
      [{ id: carla }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Carla','+5511977775555') returning id`;
      // padrão aprovado (o teste de Ajustes acima muda a política)
      await admin`update tenants set deposit_pct = 30, cancel_notice_hours = 24, late_cancel_keeps_deposit = true, no_show_keeps_deposit = true where id = ${T}`;
    });

    it("cancelar com antecedência: tudo vira crédito; voltar desfaz", async () => {
      const r = await bookC("2030-07-01", { method: "pix", amountCents: 2000 });
      if (!r.ok) throw new Error(r.code);
      const res = await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "cancelled", at("2030-06-20", "10:00")));
      expect(res).toMatchObject({ ok: true, data: { wallet: { toCredit: 2000, retained: 0 } } });
      expect(await balance()).toBe(2000);
      await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "confirmed", at("2030-06-20", "10:01")));
      expect(await balance()).toBe(0);
      expect(await withTenant(T, (tx) => wallet.appointmentPaidCents(tx, r.data.id))).toBe(2000);
      // cancelado não aceita mexer no pagamento
      await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "cancelled", at("2030-06-20", "10:02")));
      expect(await withTenant(T, (tx) => core.setPayment(tx, r.data.id, null))).toMatchObject({ ok: false });
    });

    it("cancelar em cima da hora: o sinal fica e o resto vira crédito", async () => {
      const before = await balance();
      const r = await bookC("2030-07-02", { method: "pix" });
      if (!r.ok) throw new Error(r.code);
      // pagou tudo antes (R$ 50 + crédito usado); sinal sugerido 30% de R$ 50 = R$ 15
      const paid = await withTenant(T, (tx) => wallet.appointmentPaidCents(tx, r.data.id));
      const res = await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "cancelled", at("2030-07-02", "07:00")));
      expect(res).toMatchObject({ ok: true, data: { wallet: { retained: 1500, toCredit: paid - 1500 } } });
      expect(await balance()).toBe(before + paid - 1500);
    });

    it("faltou: sinal fica para o salão", async () => {
      const r = await bookC("2030-07-03", { method: "pix", amountCents: 4000 });
      if (!r.ok) throw new Error(r.code);
      const start = await balance();
      const res = await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "no_show", at("2030-07-03", "23:00")));
      expect(res.ok && res.data.wallet).toMatchObject({ retained: 1500 });
      expect(await balance()).toBe(start + (res.ok ? res.data.wallet!.toCredit : 0));
    });

    it("crédito paga sozinho o próximo agendamento", async () => {
      const credit = await balance();
      expect(credit).toBeGreaterThan(0);
      const r = await bookC("2030-07-10", null);
      if (!r.ok) throw new Error(r.code);
      expect(r.data.credit).toBe(Math.min(credit, 5000));
      expect(await balance()).toBe(credit - r.data.credit);
      // receber o resto não cobra de novo o que o crédito pagou
      await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: "pix" }));
      expect(await withTenant(T, (tx) => wallet.appointmentPaidCents(tx, r.data.id))).toBe(5000);
      expect(await withTenant(T, (tx) => wallet.livePaidCents(tx, r.data.id))).toBe(5000 - r.data.credit);
    });

    it("devolver: tira do crédito e do caixa; não passa do crédito", async () => {
      const r = await bookC("2030-07-20", { method: "pix" });
      if (!r.ok) throw new Error(r.code);
      await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "cancelled", at("2030-07-01", "10:00")));
      const credit = await balance();
      expect(credit).toBeGreaterThan(0);
      const base = { tenantId: T, clientId: carla, method: "pix" as const };
      expect(await withTenant(T, (tx) => wallet.refundCredit(tx, { ...base, amountCents: credit + 1 }))).toBe(
        "too_much",
      );
      expect(await withTenant(T, (tx) => wallet.refundCredit(tx, { ...base, amountCents: credit }))).toBe("ok");
      expect(await balance()).toBe(0);
    });
  });

  describe("pacotes (PR 4)", () => {
    let dani: string, tpl: string;
    let pk: typeof import("@/features/wallet/packages");
    let h = 8;
    const bookD = (date: string) =>
      withTenant(T, (tx) =>
        core.insertAppointment(tx, T, {
          clientId: dani,
          serviceIds: [svc],
          date,
          time: `${String(h++).padStart(2, "0")}:00`,
          payment: null,
        }),
      );
    const left = async () => (await withTenant(T, (tx) => pk.clientPackageList(tx, dani, "2030-08-01")))[0]?.left;

    beforeAll(async () => {
      pk = await import("@/features/wallet/packages");
      [{ id: dani }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Dani','+5511977776666') returning id`;
      await admin`update tenants set no_show_uses_session = true where id = ${T}`;
      tpl = (await withTenant(T, (tx) =>
        pk.createTemplate(tx, T, {
          kind: "pay_x",
          name: "Pague 3 leve 4",
          serviceIds: [svc],
          sessionsPaid: 3,
          sessionsTotal: 4,
          priceCents: 0,
          startsOn: null,
          endsOn: null,
          maxClients: null,
        }),
      ))!;
    });

    it("vender: 4 sessões por 3 × R$ 50; entra no caixa, não no crédito", async () => {
      const sold = await withTenant(T, (tx) =>
        pk.sellPackage(tx, { tenantId: T, clientId: dani, templateId: tpl, method: "pix", today: "2030-08-01" }),
      );
      expect(sold).toMatchObject({ priceCents: 15000, sessions: 4, expiresOn: "2030-10-30" });
      expect(await left()).toBe(4);
      expect(await withTenant(T, (tx) => wallet.clientBalance(tx, dani))).toBe(0);
    });

    it("agendar usa a sessão sozinho: o serviço entra pelo valor da sessão, já pago", async () => {
      const r = await bookD("2030-08-05");
      if (!r.ok) throw new Error(r.code);
      expect(r.data.session).toMatchObject({ left: 3, total: 4 });
      const [a] = await admin`select price_cents, paid_at, client_package_id from appointments where id = ${r.data.id}`;
      expect(a.price_cents).toBe(3750);
      expect(a.paid_at).not.toBeNull();
      expect(a.client_package_id).not.toBeNull();
      expect(await left()).toBe(3);
      // concluir não cobra nada a mais
      await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "done", new Date("2030-08-05T20:00:00Z")));
      expect(await withTenant(T, (tx) => wallet.livePaidCents(tx, r.data.id))).toBe(0);
    });

    it("cancelar devolve a sessão (sem virar crédito); voltar reserva de novo", async () => {
      const r = await bookD("2030-08-06");
      if (!r.ok) throw new Error(r.code);
      expect(await left()).toBe(2);
      const res = await withTenant(T, (tx) =>
        core.setStatus(tx, r.data.id, "cancelled", new Date("2030-08-01T12:00:00Z")),
      );
      expect(res.ok && res.data.wallet).toMatchObject({ sessionBack: true, toCredit: 0, retained: 0 });
      expect(await left()).toBe(3);
      expect(await withTenant(T, (tx) => wallet.clientBalance(tx, dani))).toBe(0);
      await withTenant(T, (tx) => core.setStatus(tx, r.data.id, "confirmed", new Date("2030-08-01T12:01:00Z")));
      expect(await left()).toBe(2);
    });

    it("faltou: a sessão conta como usada (política padrão)", async () => {
      const r = await bookD("2030-08-07");
      if (!r.ok) throw new Error(r.code);
      const before = await left();
      const res = await withTenant(T, (tx) =>
        core.setStatus(tx, r.data.id, "no_show", new Date("2030-08-07T23:00:00Z")),
      );
      expect(res.ok && res.data.wallet).toMatchObject({ sessionBack: false });
      expect(await left()).toBe(before);
    });

    it("sem sessão sobrando, agenda normal (a pagar)", async () => {
      while ((await left())! > 0) await bookD("2030-08-08");
      const r = await bookD("2030-08-09");
      if (!r.ok) throw new Error(r.code);
      expect(r.data.session).toBeNull();
      const [a] = await admin`select price_cents, paid_at from appointments where id = ${r.data.id}`;
      expect(a).toMatchObject({ price_cents: 5000, paid_at: null });
    });
  });

  describe("promoções (período, limite e vários serviços)", () => {
    let pk: typeof import("@/features/wallet/packages");
    let pe: string, eva: string, fer: string, promo: string;
    const sell = (clientId: string, today: string) =>
      withTenant(T, (tx) => pk.sellPackage(tx, { tenantId: T, clientId, templateId: promo, method: "pix", today }));

    beforeAll(async () => {
      pk = await import("@/features/wallet/packages");
      [{ id: pe }] =
        await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Pé',60,4000) returning id`;
      [{ id: eva }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Eva','+5511977771111') returning id`;
      [{ id: fer }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Fer','+5511977772222') returning id`;
      promo = (await withTenant(T, (tx) =>
        pk.createTemplate(tx, T, {
          kind: "pay_x",
          name: "Dezembro: pague 1 leve 2",
          serviceIds: [pe, svc],
          sessionsPaid: 1,
          sessionsTotal: 2,
          priceCents: 0,
          startsOn: "2030-12-01",
          endsOn: "2030-12-31",
          maxClients: 1,
        }),
      ))!;
    });

    it("guarda os serviços e usa o mais caro como referência do preço", async () => {
      const [t] = await admin`select service_id, service_ids from package_templates where id = ${promo}`;
      expect(t.service_id).toBe(svc);
      expect([...t.service_ids].sort()).toEqual([pe, svc].sort());
    });

    it("fora do período não vende", async () => {
      expect(await sell(eva, "2030-11-30")).toEqual({ ok: false, reason: "scheduled" });
      expect(await sell(eva, "2031-01-01")).toEqual({ ok: false, reason: "ended" });
    });

    it("limite: 1 por cliente e esgota na N-ésima", async () => {
      expect(await sell(eva, "2030-12-02")).toMatchObject({ ok: true, priceCents: 5000, sessions: 2 });
      expect(await sell(eva, "2030-12-03")).toEqual({ ok: false, reason: "already_bought" });
      expect(await sell(fer, "2030-12-03")).toEqual({ ok: false, reason: "sold_out" });
      const [row] = (await withTenant(T, (tx) => pk.listTemplates(tx))).filter((t) => t.id === promo);
      expect(row).toMatchObject({ soldClients: 1, maxClients: 1 });
      expect(row!.services.map((s) => s.id).sort()).toEqual([pe, svc].sort());
    });

    it("a sessão vale em qualquer serviço do pacote", async () => {
      const r = await withTenant(T, (tx) =>
        core.insertAppointment(tx, T, {
          clientId: eva,
          serviceIds: [pe],
          date: "2030-12-05",
          time: "10:00",
          payment: null,
        }),
      );
      if (!r.ok) throw new Error(r.code);
      expect(r.data.session).toMatchObject({ left: 1, total: 2 });
      const [a] = await admin`select price_cents, paid_at from appointments where id = ${r.data.id}`;
      expect(a.price_cents).toBe(2500);
      expect(a.paid_at).not.toBeNull();
    });
  });
});
