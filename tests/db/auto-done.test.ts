// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("conclusão automática da agenda (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, S: string, C: string;
  const now = new Date();
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000);

  beforeAll(async () => {
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio Auto') returning id`;
    [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia Souza','+5511977770002') returning id`;
  });
  afterAll(async () => admin.end());

  /** Atendimento de 1 h começando `h` horas a partir de agora. */
  const appt = async (h: number, status = "confirmed") =>
    (
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${C},${S},${at(h).toISOString()},${at(h + 1).toISOString()},8000,${status}) returning id`
    )[0].id as string;
  const row = async (id: string) =>
    (await admin`select status, auto_done_at from appointments where id = ${id}`)[0];
  const payments = async (id: string) =>
    admin`select amount_cents, occurred_at from client_ledger where appointment_id = ${id} and kind = 'payment'`;
  const paid = async (id: string) => {
    const { withTenant } = await import("@/db/client");
    const { appointmentPaidCents } = await import("@/features/wallet/core");
    return withTenant(T, (tx) => appointmentPaidCents(tx, id));
  };
  const lib = async () => ({
    ...(await import("@/db/client")),
    ...(await import("@/features/appointments/core")),
    ...(await import("@/features/appointments/auto-done-run")),
  });

  it("conclui o que terminou (aguardando ou confirmado), com a baixa na hora do fim", async () => {
    const { withTenant, autoConcludePast } = await lib();
    const confirmed = await appt(-3);
    const pending = await appt(-5, "pending_confirmation");
    expect(await withTenant(T, (tx) => autoConcludePast(tx, now))).toBe(2);
    for (const id of [confirmed, pending]) {
      const r = await row(id);
      expect(r.status).toBe("done");
      expect(r.auto_done_at).not.toBeNull();
    }
    const [p] = await payments(confirmed);
    expect(p.amount_cents).toBe(8000);
    expect(new Date(p.occurred_at).getTime()).toBe(at(-2).getTime());
    // Segunda rodada não conclui nem cobra de novo
    expect(await withTenant(T, (tx) => autoConcludePast(tx, now))).toBe(0);
    expect(await payments(confirmed)).toHaveLength(1);
  });

  it("não mexe no futuro, no que ainda está acontecendo, em quem pediu para remarcar nem no atraso antigo", async () => {
    const { withTenant, autoConcludePast, AUTO_DONE_LOOKBACK_DAYS } = await lib();
    const future = await appt(2);
    const ongoing = await appt(-0.5);
    const resched = await appt(-3, "reschedule_requested");
    const old = await appt(-(AUTO_DONE_LOOKBACK_DAYS * 24 + 5));
    const noShow = await appt(-3, "no_show");
    expect(await withTenant(T, (tx) => autoConcludePast(tx, now))).toBe(0);
    expect((await row(future)).status).toBe("confirmed");
    expect((await row(ongoing)).status).toBe("confirmed");
    expect((await row(resched)).status).toBe("reschedule_requested");
    expect((await row(old)).status).toBe("confirmed");
    expect((await row(noShow)).status).toBe("no_show");
  });

  it("trocar para Faltou anula a baixa automática e tira o selo do sistema", async () => {
    const { withTenant, autoConcludePast, setStatus } = await lib();
    const id = await appt(-4);
    await withTenant(T, (tx) => autoConcludePast(tx, now));
    const res = await withTenant(T, (tx) => setStatus(tx, id, "no_show", now));
    expect(res.ok).toBe(true);
    const r = await row(id);
    expect(r.status).toBe("no_show");
    expect(r.auto_done_at).toBeNull();
    expect(await paid(id)).toBe(0);
  });

  it("remarcar um concluído volta a aguardar e anula a baixa", async () => {
    const { withTenant, autoConcludePast, editAppointment } = await lib();
    const { todayStr, addDays } = await import("@/lib/dates");
    const id = await appt(-6);
    await withTenant(T, (tx) => autoConcludePast(tx, now));
    const res = await withTenant(T, (tx) =>
      editAppointment(tx, T, id, { date: addDays(todayStr(), 3), time: "10:00", serviceId: S }, "skip"),
    );
    expect(res.ok).toBe(true);
    const r = await row(id);
    expect(r.status).toBe("pending_confirmation");
    expect(r.auto_done_at).toBeNull();
    expect(await paid(id)).toBe(0);
  });

  it("rodada do worker passa por todos os estúdios", async () => {
    const { runAutoDone } = await lib();
    await appt(-2);
    expect(await runAutoDone(now)).toEqual({ done: 1, failed: 0 });
  });
});
