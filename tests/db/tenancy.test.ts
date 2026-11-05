// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("multitenancy e agenda (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string, svcA: string, cliA: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let schema: typeof import("@/db/schema");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    schema = await import("@/db/schema");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Estúdio A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Estúdio B') returning id`;
    [{ id: svcA }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${A},'Alongamento',120,15000) returning id`;
    [{ id: cliA }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${A},'Maria','+5511999990000') returning id`;
  });
  afterAll(async () => admin.end());

  const appt = (start: string, end: string, status = "confirmed") => ({
    tenantId: A,
    clientId: cliA,
    serviceId: svcA,
    priceCents: 15000,
    startsAt: new Date(start),
    endsAt: new Date(end),
    status: status as "confirmed",
  });

  it("um estúdio não enxerga dados do outro", async () => {
    const asB = await withTenant(B, (tx) => tx.select().from(schema.clients));
    const asA = await withTenant(A, (tx) => tx.select().from(schema.clients));
    expect(asB).toHaveLength(0);
    expect(asA).toHaveLength(1);
  });

  it("sem estúdio ativo não retorna nada", async () => {
    const rows = await withTenant("00000000-0000-0000-0000-000000000000", (tx) => tx.select().from(schema.clients));
    expect(rows).toHaveLength(0);
  });

  it("não deixa gravar dado em nome de outro estúdio", async () => {
    await expect(
      withTenant(B, (tx) => tx.insert(schema.clients).values({ tenantId: A, name: "X", phoneE164: "+5511888880000" })),
    ).rejects.toThrow();
  });

  it("telefone duplicado no mesmo estúdio é recusado", async () => {
    await expect(
      withTenant(A, (tx) =>
        tx.insert(schema.clients).values({ tenantId: A, name: "Outra", phoneE164: "+5511999990000" }),
      ),
    ).rejects.toThrow();
  });

  it("impede agendamentos sobrepostos, mas permite colado e cancelado", async () => {
    await withTenant(A, (tx) =>
      tx.insert(schema.appointments).values(appt("2026-11-10T13:00:00Z", "2026-11-10T15:00:00Z")),
    );
    await expect(
      withTenant(A, (tx) =>
        tx.insert(schema.appointments).values(appt("2026-11-10T14:00:00Z", "2026-11-10T16:00:00Z")),
      ),
    ).rejects.toThrow();
    await withTenant(A, (tx) =>
      tx.insert(schema.appointments).values(appt("2026-11-10T15:00:00Z", "2026-11-10T16:00:00Z")),
    );
    await withTenant(A, (tx) =>
      tx.insert(schema.appointments).values(appt("2026-11-10T13:30:00Z", "2026-11-10T14:00:00Z", "cancelled")),
    );
  });
});

d("clientes (núcleo)", () => {
  it("cadastra, recusa telefone repetido e busca por nome/telefone", async () => {
    const { withTenant } = await import("@/db/client");
    const { insertClient, searchClients } = await import("@/features/clients/core");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio C') returning id`;
    await admin.end();

    const a = await withTenant(T, (tx) => insertClient(tx, T, { name: "Ana Souza", phone: "+5511911112222" }));
    expect(a.ok).toBe(true);
    const dup = await withTenant(T, (tx) => insertClient(tx, T, { name: "Outra", phone: "+5511911112222" }));
    expect(dup).toMatchObject({ ok: false, code: "PHONE_EXISTS", field: "phone" });
    expect(await withTenant(T, (tx) => searchClients(tx, "ana"))).toHaveLength(1);
    expect(await withTenant(T, (tx) => searchClients(tx, "(11) 91111"))).toHaveLength(1);
    expect(await withTenant(T, (tx) => searchClients(tx, "zzz"))).toHaveLength(0);
  });
});

d("agendamentos (núcleo)", () => {
  it("cria, bloqueia horário ocupado, lista o dia e calcula o previsto", async () => {
    const { withTenant } = await import("@/db/client");
    const { insertAppointment, listDay, forecastCents, setStatus } = await import("@/features/appointments/core");
    const { dayRange } = await import("@/lib/dates");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio D') returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',90,12000) returning id`;
    const [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia','+5511900001111') returning id`;
    await admin.end();

    const base = { clientId: C, serviceId: S, date: "2026-11-12" };
    const a = await withTenant(T, (tx) => insertAppointment(tx, T, { ...base, time: "09:00" }));
    expect(a.ok).toBe(true);
    const clash = await withTenant(T, (tx) => insertAppointment(tx, T, { ...base, time: "10:00" }));
    expect(clash).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
    const b = await withTenant(T, (tx) => insertAppointment(tx, T, { ...base, time: "10:30" }));
    expect(b.ok).toBe(true);

    let rows = await withTenant(T, (tx) => listDay(tx, dayRange("2026-11-12")));
    expect(rows.map((r) => r.clientName)).toEqual(["Bia", "Bia"]);
    expect(forecastCents(rows)).toBe(24000);
    expect(await withTenant(T, (tx) => listDay(tx, dayRange("2026-11-13")))).toHaveLength(0);

    if (!a.ok) throw new Error("unreachable");
    await withTenant(T, (tx) => setStatus(tx, a.data.id, "cancelled"));
    rows = await withTenant(T, (tx) => listDay(tx, dayRange("2026-11-12")));
    expect(rows).toHaveLength(1);
    expect(forecastCents(rows)).toBe(12000);
  });
});

d("expediente (núcleo)", () => {
  it("usa o padrão sem configuração e grava/lê o que foi salvo", async () => {
    const { withTenant } = await import("@/db/client");
    const { getHours, saveHours } = await import("@/features/hours/core");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio H') returning id`;
    await admin.end();

    const def = await withTenant(T, (tx) => getHours(tx));
    expect(def[0]).toBeNull();
    expect(def[1]).toEqual({ opens: "09:00", closes: "18:00" });

    const week = [null, { opens: "10:00", closes: "16:00" }, null, null, null, null, null];
    await withTenant(T, (tx) => saveHours(tx, T, week));
    expect(await withTenant(T, (tx) => getHours(tx))).toEqual(week);
    await expect(
      withTenant(T, (tx) =>
        saveHours(tx, T, [null, { opens: "12:00", closes: "10:00" }, null, null, null, null, null]),
      ),
    ).rejects.toThrow();
  });
});

d("sincronização com o Google (porta simulada)", () => {
  it("cria, atualiza, apaga e não trava quando o Google falha", async () => {
    const { withTenant } = await import("@/db/client");
    const { insertAppointment, setStatus } = await import("@/features/appointments/core");
    const { syncAppointment } = await import("@/features/google/sync");
    const { GoogleAuthError, GoogleApiError } = await import("@/features/google/calendar");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio G') returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    const [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia','+5511900002222') returning id`;
    const eventOf = async (id: string) =>
      (await admin`select google_event_id as e from appointments where id=${id}`)[0].e;

    const calls: string[] = [];
    const port = {
      createEvent: async () => (calls.push("create"), "evt-1"),
      updateEvent: async (id: string) => void calls.push(`update:${id}`),
      deleteEvent: async (id: string) => void calls.push(`delete:${id}`),
    };
    const a = await withTenant(T, (tx) =>
      insertAppointment(tx, T, { clientId: C, serviceId: S, date: "2026-11-12", time: "09:00" }),
    );
    if (!a.ok) throw new Error("setup");
    const id = a.data.id;

    expect(await withTenant(T, (tx) => syncAppointment(tx, null, id))).toBe("skipped");
    expect(await withTenant(T, (tx) => syncAppointment(tx, port, id))).toBe("synced");
    expect(await eventOf(id)).toBe("evt-1");
    expect(await withTenant(T, (tx) => syncAppointment(tx, port, id))).toBe("synced");
    await withTenant(T, (tx) => setStatus(tx, id, "cancelled"));
    expect(await withTenant(T, (tx) => syncAppointment(tx, port, id))).toBe("synced");
    expect(await eventOf(id)).toBeNull();
    expect(calls).toEqual(["create", "update:evt-1", "delete:evt-1"]);

    await withTenant(T, (tx) => setStatus(tx, id, "confirmed"));
    const auth = {
      ...port,
      createEvent: async () => {
        throw new GoogleAuthError("401");
      },
    };
    const down = {
      ...port,
      createEvent: async () => {
        throw new GoogleApiError("500");
      },
    };
    expect(await withTenant(T, (tx) => syncAppointment(tx, auth, id))).toBe("auth");
    expect(await withTenant(T, (tx) => syncAppointment(tx, down, id))).toBe("failed");
    expect(await eventOf(id)).toBeNull();
    await admin.end();
  });
});

d("pendências (núcleo)", () => {
  it("separa o que fechar, confirmar e mandar ao Google", async () => {
    const { withTenant } = await import("@/db/client");
    const { listPendencias, countPendencias } = await import("@/features/appointments/pendencias");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio P') returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    const [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia','+5511900003333') returning id`;
    const mk = (start: string, end: string, status: string, ev: string | null) =>
      admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,google_event_id) values (${T},${C},${S},${start},${end},10000,${status},${ev})`;
    const now = new Date("2026-11-10T15:00:00Z");
    await mk("2026-11-10T10:00:00Z", "2026-11-10T11:00:00Z", "confirmed", "e1"); // passou → fechar
    await mk("2026-11-10T12:00:00Z", "2026-11-10T13:00:00Z", "done", "e2"); // concluído → nada
    await mk("2026-11-11T10:00:00Z", "2026-11-11T11:00:00Z", "pending_confirmation", "e3"); // confirmar
    await mk("2026-11-12T10:00:00Z", "2026-11-12T11:00:00Z", "confirmed", null); // sem Google
    await mk("2026-11-13T10:00:00Z", "2026-11-13T11:00:00Z", "cancelled", null); // cancelado → nada
    await admin.end();

    const withG = await withTenant(T, (tx) => listPendencias(tx, now, true));
    expect([withG.toClose.length, withG.toConfirm.length, withG.unsynced.length]).toEqual([1, 1, 1]);
    expect(countPendencias(withG)).toBe(3);
    const noG = await withTenant(T, (tx) => listPendencias(tx, now, false));
    expect(noG.unsynced).toHaveLength(0);
  });
});

d("bloqueios e pausas (núcleo)", () => {
  it("bloqueia vagas, recusa conflito nos dois sentidos e remove", async () => {
    const { withTenant } = await import("@/db/client");
    const { insertAppointment } = await import("@/features/appointments/core");
    const { insertBlock, listBlocks, removeBlock } = await import("@/features/blocks/core");
    const { dayRange } = await import("@/lib/dates");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio B2') returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    const [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia','+5511900004444') returning id`;
    await admin.end();
    const date = "2026-11-12";

    const b = await withTenant(T, (tx) => insertBlock(tx, T, { date, start: "12:00", end: "13:00", reason: "Almoço" }));
    expect(b.ok).toBe(true);
    // agendar em cima do bloqueio é recusado; encostar é permitido
    expect(
      await withTenant(T, (tx) => insertAppointment(tx, T, { clientId: C, serviceId: S, date, time: "12:30" })),
    ).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
    expect(
      (await withTenant(T, (tx) => insertAppointment(tx, T, { clientId: C, serviceId: S, date, time: "13:00" }))).ok,
    ).toBe(true);
    // bloquear em cima de agendamento é recusado
    expect(await withTenant(T, (tx) => insertBlock(tx, T, { date, start: "13:30", end: "14:00" }))).toMatchObject({
      ok: false,
      code: "HAS_APPOINTMENTS",
    });

    expect(await withTenant(T, (tx) => listBlocks(tx, dayRange(date)))).toHaveLength(1);
    if (!b.ok) throw new Error("setup");
    expect((await withTenant(T, (tx) => removeBlock(tx, b.data.id))).ok).toBe(true);
    expect(await withTenant(T, (tx) => removeBlock(tx, b.data.id))).toMatchObject({ ok: false });
    expect(
      (await withTenant(T, (tx) => insertAppointment(tx, T, { clientId: C, serviceId: S, date, time: "12:00" }))).ok,
    ).toBe(true);
  });
});

d("lembretes (núcleo)", () => {
  it("manda uma vez, não repete, devolve à fila se falhar e para se estiver offline", async () => {
    const { withTenant } = await import("@/db/client");
    const { sendReminders } = await import("@/features/reminders/core");
    const { MessagingOfflineError, MessagingTransientError } = await import("@/features/messaging/port");
    const admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    const [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio R') returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    const [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia Souza','+5511900005555') returning id`;
    const mk = (start: string, end: string, status: string) =>
      admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status) values (${T},${C},${S},${start},${end},10000,${status})`;
    const now = new Date("2026-11-10T15:00:00Z");
    await mk("2026-11-11T10:00:00Z", "2026-11-11T11:00:00Z", "confirmed"); // dentro de 24h → manda
    await mk("2026-11-13T10:00:00Z", "2026-11-13T11:00:00Z", "confirmed"); // longe → não
    await mk("2026-11-11T12:00:00Z", "2026-11-11T13:00:00Z", "cancelled"); // cancelado → não
    await mk("2026-11-10T10:00:00Z", "2026-11-10T11:00:00Z", "confirmed"); // já passou → não

    const sent: string[] = [];
    const ok = { sendText: async (to: string, t: string) => void sent.push(`${to}|${t}`) };
    expect(await withTenant(T, (tx) => sendReminders(tx, ok, now))).toEqual({ sent: 1, failed: 0, offline: false });
    expect(sent[0]).toContain("+5511900005555|Oi, Bia!");
    // segunda rodada: nada novo
    expect(await withTenant(T, (tx) => sendReminders(tx, ok, now))).toEqual({ sent: 0, failed: 0, offline: false });

    // novo agendamento; falha temporária devolve à fila e a próxima rodada envia
    await mk("2026-11-11T14:00:00Z", "2026-11-11T15:00:00Z", "pending_confirmation");
    const flaky = {
      sendText: async () => {
        throw new MessagingTransientError("500");
      },
    };
    expect(await withTenant(T, (tx) => sendReminders(tx, flaky, now))).toEqual({ sent: 0, failed: 1, offline: false });
    expect(await withTenant(T, (tx) => sendReminders(tx, ok, now))).toMatchObject({ sent: 1, failed: 0 });

    // offline: marca e para
    await mk("2026-11-11T11:00:00Z", "2026-11-11T11:30:00Z", "confirmed");
    await mk("2026-11-11T13:00:00Z", "2026-11-11T14:00:00Z", "confirmed");
    const off = {
      sendText: async () => {
        throw new MessagingOfflineError("401");
      },
    };
    expect(await withTenant(T, (tx) => sendReminders(tx, off, now))).toEqual({ sent: 0, failed: 2, offline: true });
    expect(await withTenant(T, (tx) => sendReminders(tx, ok, now))).toMatchObject({ sent: 2 });
    await admin.end();
  });
});
