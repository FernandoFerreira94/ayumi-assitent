// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("histórico da cliente (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, T2: string, svc: string, ana: string, bia: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let h: typeof import("@/features/clients/history");
  let rules: typeof import("@/features/clients/history-rules");
  const ids: Record<string, string> = {};

  const appt = async (tenant: string, client: string, service: string, at: string, status: string, price = 5000) => {
    const [{ id }] = await admin`insert into appointments (tenant_id, client_id, service_id, starts_at, ends_at, price_cents, status)
      values (${tenant}, ${client}, ${service}, ${at}::timestamptz, ${at}::timestamptz + interval '1 hour', ${price}, ${status})
      returning id`;
    return id as string;
  };

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    h = await import("@/features/clients/history");
    rules = await import("@/features/clients/history-rules");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio Histórico') returning id`;
    [{ id: T2 }] = await admin`insert into tenants (name) values ('Outro') returning id`;
    [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Unha',60,5000) returning id`;
    const [{ id: svc2 }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T2},'Cabelo',60,9000) returning id`;
    [{ id: ana }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511977775555') returning id`;
    [{ id: bia }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T2},'Bia','+5511977776666') returning id`;

    ids.done1 = await appt(T, ana, svc, "2026-09-01T13:00:00Z", "done");
    ids.noShow = await appt(T, ana, svc, "2026-09-15T13:00:00Z", "no_show");
    ids.cancel = await appt(T, ana, svc, "2026-10-01T13:00:00Z", "cancelled");
    ids.done2 = await appt(T, ana, svc, "2026-10-20T13:00:00Z", "done", 6000);
    ids.future = await appt(T, ana, svc, "2030-01-10T13:00:00Z", "confirmed");
    await appt(T2, bia, svc2, "2026-10-05T13:00:00Z", "done");

    // dinheiro: sinal do done2, pagamento anulado (não aparece) e devolução avulsa
    await admin`insert into client_ledger (tenant_id, client_id, appointment_id, kind, amount_cents, method, occurred_at)
      values (${T}, ${ana}, ${ids.done2}, 'payment', 2000, 'pix', '2026-10-18T12:00:00Z')`;
    const [{ id: wrong }] = await admin`insert into client_ledger (tenant_id, client_id, appointment_id, kind, amount_cents, occurred_at)
      values (${T}, ${ana}, ${ids.done1}, 'payment', 5000, '2026-09-01T15:00:00Z') returning id`;
    await admin`insert into client_ledger (tenant_id, client_id, appointment_id, kind, amount_cents, reverses_id, occurred_at)
      values (${T}, ${ana}, ${ids.done1}, 'payment', -5000, ${wrong}, '2026-09-01T16:00:00Z')`;
    await admin`insert into client_ledger (tenant_id, client_id, kind, amount_cents, occurred_at)
      values (${T}, ${ana}, 'credit_in', 1500, '2026-10-02T12:00:00Z')`;
    await admin`insert into client_ledger (tenant_id, client_id, kind, amount_cents, method, occurred_at)
      values (${T}, ${ana}, 'refund', 1500, 'pix', '2026-10-03T12:00:00Z')`;

    // pacote vendido (venda + sessões) e um atendimento que usou o pacote
    const [{ id: pkg }] = await admin`insert into client_packages (tenant_id, client_id, name, service_id, service_ids, sessions_total, price_cents, sold_on, expires_on, created_at)
      values (${T}, ${ana}, 'Pague 3 leve 4', ${svc}, ${[svc]}::uuid[], 4, 15000, '2026-10-10', '2030-01-08', '2026-10-10T12:00:00Z') returning id`;
    await admin`insert into client_ledger (tenant_id, client_id, client_package_id, kind, sessions, occurred_at)
      values (${T}, ${ana}, ${pkg}, 'session_grant', 4, '2026-10-10T12:00:00Z')`;
    await admin`insert into client_ledger (tenant_id, client_id, client_package_id, kind, amount_cents, method, occurred_at)
      values (${T}, ${ana}, ${pkg}, 'payment', 15000, 'pix', '2026-10-10T12:00:00Z')`;
    await admin`update appointments set client_package_id = ${pkg} where id = ${ids.done2}`;
    await admin`insert into client_ledger (tenant_id, client_id, client_package_id, appointment_id, kind, sessions, amount_cents, occurred_at)
      values (${T}, ${ana}, ${pkg}, ${ids.done2}, 'session_reserve', 1, 3750, '2026-10-18T12:00:00Z')`;
  });
  afterAll(async () => admin.end());

  const page = (filter: import("@/features/clients/history-rules").HistoryFilter, cursor: string | null = null, size = 20) =>
    withTenant(T, (tx) => h.clientHistoryPage(tx, ana, filter, rules.decodeCursor(cursor), size));

  it("tudo: atendimentos, pacote e dinheiro avulso, do mais novo ao mais velho; anulação some", async () => {
    const { items, next } = await page("all");
    expect(next).toBeNull();
    expect(items.map((e) => `${e.type}:${e.type === "visit" ? e.status : e.type === "money" ? e.kind : e.name}`)).toEqual([
      "visit:confirmed",
      "visit:done",
      "package:Pague 3 leve 4",
      "money:refund",
      "money:credit_in",
      "visit:cancelled",
      "visit:no_show",
      "visit:done",
    ]);
    const done2 = items.find((e) => e.id === ids.done2);
    // pago = sinal + sessão do pacote
    expect(done2).toMatchObject({ type: "visit", paidCents: 5750, packageName: "Pague 3 leve 4" });
  });

  it("pagamentos: todo dinheiro, inclusive o do atendimento e o do pacote, sem anulações", async () => {
    const { items } = await page("payments");
    expect(items.map((e) => (e.type === "money" ? `${e.kind}:${e.amountCents}` : e.type))).toEqual([
      "payment:2000",
      "payment:15000",
      "refund:1500",
      "credit_in:1500",
    ]);
    const sinal = items[0];
    if (sinal.type !== "money") throw new Error();
    expect(rules.moneyLabel(sinal)).toBe("Sinal");
    expect(rules.moneyLabel(items[1] as never)).toBe("Pagou o pacote Pague 3 leve 4");
  });

  it("faltas e planos filtram", async () => {
    expect((await page("no_show")).items.map((e) => e.id)).toEqual([ids.noShow]);
    expect((await page("plans")).items.map((e) => e.type)).toEqual(["visit", "package"]);
  });

  it("pagina sem repetir nem pular", async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 10; i++) {
      const p: Awaited<ReturnType<typeof page>> = await page("all", cursor, 3);
      seen.push(...p.items.map((e) => `${e.type}:${e.id}`));
      cursor = p.next;
      if (!cursor) break;
    }
    const all = (await page("all")).items.map((e) => `${e.type}:${e.id}`);
    expect(seen).toEqual(all);
  });

  it("resumo: números do salão certo", async () => {
    const s = await withTenant(T, (tx) => h.clientHistorySummary(tx, ana, "2026-11-23", new Date("2026-11-23T12:00:00Z")));
    expect(s).toMatchObject({ done: 2, noShows: 1, cancelled: 1, spentCents: 11000, creditCents: 0 });
    expect(s?.next?.toISOString()).toBe("2030-01-10T13:00:00.000Z");
    expect(s?.plans).toEqual([{ name: "Pague 3 leve 4", left: 3, total: 4, expiresOn: "2030-01-08" }]);
  });

  it("isolamento: outro salão não vê a cliente nem o histórico", async () => {
    expect(await withTenant(T2, (tx) => h.clientHistorySummary(tx, ana, "2026-11-23"))).toBeNull();
    expect((await withTenant(T2, (tx) => h.clientHistoryPage(tx, ana, "all", null))).items).toEqual([]);
    expect((await withTenant(T, (tx) => h.clientHistoryPage(tx, bia, "all", null))).items).toEqual([]);
  });
});
