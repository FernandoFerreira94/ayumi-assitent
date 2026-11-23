// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MessagingOfflineError, MessagingTransientError, type MessagingPort } from "@/features/messaging/port";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("aviso de remarcação no WhatsApp (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, svc: string, cli: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/appointments/core");
  let send: typeof import("@/features/messaging/reschedule-send");

  // Porta falsa: guarda o que saiu; `fail` faz a próxima chamada lançar
  let sent: { to: string; text: string }[] = [];
  let fail: Error | null = null;
  const port: MessagingPort = {
    sendText: async (to, text) => {
      if (fail) throw fail;
      sent.push({ to, text });
      return { id: `wa-${sent.length}-${Math.random()}` };
    },
  };

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/appointments/core");
    send = await import("@/features/messaging/reschedule-send");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name, address) values ('Estúdio Lua', 'Rua A, 10') returning id`;
    [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Escova',60,8000) returning id`;
    [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana Souza','+5511977770000') returning id`;
  });
  afterAll(async () => admin.end());
  beforeEach(async () => {
    sent = [];
    fail = null;
    await admin`update tenants set reschedule_notice = true, reschedule_template = null where id = ${T}`;
    await admin`update clients set opted_out_at = null where id = ${cli}`;
  });

  // Longe da janela do 1º aviso (24 h) para o aviso sair sem as opções
  const insert = async (start: string, status = "confirmed") => {
    const end = new Date(new Date(start).getTime() + 3600_000).toISOString();
    const [{ id }] = await admin`
      insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${cli},${svc},${start},${end},8000,${status}) returning id`;
    return id as string;
  };
  const edit = (id: string, date: string, time: string, notice: "now" | "skip" = "now") =>
    withTenant(T, (tx) => core.editAppointment(tx, T, id, { date, time, serviceId: svc }, notice));
  const drag = (id: string, start: string) =>
    withTenant(T, (tx) =>
      core.moveAppointment(tx, T, id, new Date(start), new Date(new Date(start).getTime() + 3600_000), "later"),
    );
  const flush = (id: string, p: MessagingPort | null = port, now = new Date()) =>
    withTenant(T, (tx) => send.sendRescheduleNotice(tx, T, id, p, now));
  const row = async (id: string) =>
    (
      await admin`select reschedule_notice_at, notified_starts_at, reminder_sent_at from appointments where id = ${id}`
    )[0];

  it("folha Remarcar: avisa uma vez, com dia, hora, endereço e sem o nome da cliente", async () => {
    const id = await insert("2030-03-10T13:00:00Z");
    expect(await edit(id, "2030-03-12", "15:30")).toEqual({ ok: true, data: { moved: true } });
    expect(await flush(id)).toBe("sent");
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("+5511977770000");
    expect(sent[0].text).toContain("Escova foi remarcado");
    expect(sent[0].text).toContain("dia 12/03");
    expect(sent[0].text).toContain("15:30");
    expect(sent[0].text).toContain("📍 Rua A, 10");
    expect(sent[0].text).not.toContain("Ana");
    expect(sent[0].text).not.toContain("1 - Confirmo");
    const r = await row(id);
    expect(r.reschedule_notice_at).toBeNull();
    expect(new Date(r.notified_starts_at).toISOString()).toBe("2030-03-12T18:30:00.000Z");
    // Idempotente: a segunda chamada (outra aba, worker) não manda de novo
    expect(await flush(id)).toBe("none");
    expect(sent).toHaveLength(1);
    const [m] = await admin`select kind, direction from messages where appointment_id = ${id}`;
    expect(m).toMatchObject({ kind: "reminder", direction: "out" });
  });

  it("leva o mesmo link do convite do agendamento (atualiza o evento que a cliente salvou)", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://app.test");
    vi.stubEnv("BETTER_AUTH_SECRET", "segredo-de-teste-segredo-de-teste");
    try {
      const { inviteUrl } = await import("@/features/calendar-feed/invite-token");
      const id = await insert("2030-03-09T13:00:00Z");
      await edit(id, "2030-03-09", "16:00");
      expect(await flush(id)).toBe("sent");
      const url = inviteUrl(T, id)!;
      expect(url).toMatch(/^https:\/\/app\.test\/api\/agenda\/convite\/.+\.ics$/);
      expect(sent[0].text).toContain(`📲 Atualize na sua agenda: ${url}`);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("só trocar o serviço (mesmo horário) não gera aviso", async () => {
    const id = await insert("2030-03-11T13:00:00Z");
    expect(await edit(id, "2030-03-11", "10:00")).toEqual({ ok: true, data: { moved: false } });
    expect((await row(id)).reschedule_notice_at).toBeNull();
    expect(await flush(id)).toBe("none");
    expect(sent).toHaveLength(0);
  });

  it("arraste espera o Desfazer; arrastar e desfazer não manda nada", async () => {
    const id = await insert("2030-03-13T13:00:00Z");
    await drag(id, "2030-03-13T15:00:00Z");
    // Antes do fim do Desfazer: ainda não vence
    expect(await flush(id)).toBe("none");
    await drag(id, "2030-03-13T13:00:00Z"); // Desfazer
    expect(await flush(id, port, new Date(Date.now() + 60_000))).toBe("unchanged");
    expect(sent).toHaveLength(0);
  });

  it("arrastou e não desfez: o worker manda o horário final", async () => {
    const id = await insert("2030-03-14T13:00:00Z");
    await drag(id, "2030-03-14T14:00:00Z");
    await drag(id, "2030-03-14T16:00:00Z");
    const later = new Date(Date.now() + 60_000);
    expect(await withTenant(T, (tx) => send.sendDueRescheduleNotices(tx, T, port, later))).toEqual({
      sent: 1,
      failed: 0,
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain("13:00"); // 16:00Z = 13:00 em Brasília
  });

  it("dona desligou só desta vez: nada pendente e o horário novo vira o conhecido", async () => {
    const id = await insert("2030-03-15T13:00:00Z");
    await edit(id, "2030-03-16", "10:00", "skip");
    const r = await row(id);
    expect(r.reschedule_notice_at).toBeNull();
    expect(new Date(r.notified_starts_at).toISOString()).toBe("2030-03-16T13:00:00.000Z");
  });

  it("desligado em Ajustes, cliente com SAIR ou estúdio sem WhatsApp: não envia e diz o motivo", async () => {
    const a = await insert("2030-03-17T13:00:00Z");
    await admin`update tenants set reschedule_notice = false where id = ${T}`;
    await edit(a, "2030-03-18", "10:00");
    expect(await flush(a)).toBe("off");
    await admin`update tenants set reschedule_notice = true where id = ${T}`;

    const b = await insert("2030-03-19T13:00:00Z");
    await admin`update clients set opted_out_at = now() where id = ${cli}`;
    await edit(b, "2030-03-20", "10:00");
    expect(await flush(b)).toBe("opted_out");
    await admin`update clients set opted_out_at = null where id = ${cli}`;

    const c = await insert("2030-03-21T13:00:00Z");
    await edit(c, "2030-03-22", "10:00");
    expect(await flush(c, null)).toBe("no_whatsapp");
    expect(sent).toHaveLength(0);
  });

  it("WhatsApp desconectado não volta para a fila; falha temporária volta e o worker manda depois", async () => {
    const a = await insert("2030-03-23T13:00:00Z");
    await edit(a, "2030-03-24", "10:00");
    fail = new MessagingOfflineError("401");
    expect(await flush(a)).toBe("offline");
    expect((await row(a)).reschedule_notice_at).toBeNull();

    const b = await insert("2030-03-25T13:00:00Z");
    await edit(b, "2030-03-26", "10:00");
    fail = new MessagingTransientError("503");
    const now = new Date();
    expect(await flush(b, port, now)).toBe("retry");
    expect(new Date((await row(b)).reschedule_notice_at).getTime()).toBe(now.getTime() + send.RETRY_MS);
    fail = null;
    const later = new Date(now.getTime() + send.RETRY_MS + 1000);
    expect(await withTenant(T, (tx) => send.sendDueRescheduleNotices(tx, T, port, later))).toEqual({
      sent: 1,
      failed: 0,
    });
  });

  it("horário novo já na janela do 1º aviso: vai com 1/2/3 e conta como o 1º aviso", async () => {
    const soon = new Date(Date.now() + 5 * 3600_000);
    soon.setUTCMinutes(0, 0, 0);
    const id = await insert(new Date(soon.getTime() + 24 * 3600_000).toISOString());
    // Remarca para daqui a ~5 h, no fuso do estúdio
    const local = new Date(soon.getTime() - 3 * 3600_000).toISOString();
    expect((await edit(id, local.slice(0, 10), local.slice(11, 16))).ok).toBe(true);
    expect(await flush(id)).toBe("sent");
    expect(sent[0].text).toContain("1 - Confirmo");
    expect((await row(id)).reminder_sent_at).not.toBeNull();
  });
});
