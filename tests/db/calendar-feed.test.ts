// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("link do calendário (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string, anaA: string, biaA: string, bruna: string;
  let feed: typeof import("@/features/calendar-feed/server");

  // O link e o "ocultar nomes" moram na profissional (professionals), não no salão.
  beforeAll(async () => {
    feed = await import("@/features/calendar-feed/server");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Studio A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Studio B') returning id`;
    [{ id: anaA }] =
      await admin`insert into professionals (tenant_id, display_name, position, calendar_token_hash) values (${A},'Ana',0,'hash-a') returning id`;
    [{ id: biaA }] =
      await admin`insert into professionals (tenant_id, display_name, position, calendar_token_hash) values (${A},'Bia',1,'hash-bia') returning id`;
    [{ id: bruna }] =
      await admin`insert into professionals (tenant_id, display_name, position, calendar_token_hash) values (${B},'Bruna',0,'hash-b') returning id`;
    const day = new Date(Date.now() + 2 * 86_400_000);
    day.setUTCHours(12, 0, 0, 0);
    const later = new Date(day.getTime() + 86_400_000);
    const h = (d0: Date, n: number) => new Date(d0.getTime() + n * 3_600_000);
    for (const [t, prof, client, phone] of [
      [A, anaA, "Ana Souza", "+5511911111111"],
      [A, biaA, "Beatriz Alves", "+5511933333333"],
      [B, bruna, "Bia Lima", "+5511922222222"],
    ] as const) {
      const [{ id: c }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${t},${client},${phone}) returning id`;
      const [{ id: s }] =
        await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${t},'Corte',60,5000) returning id`;
      await admin`insert into appointments (tenant_id,professional_id,client_id,service_id,starts_at,ends_at,price_cents,status)
        values (${t},${prof},${c},${s},${day},${h(day, 1)},5000,'confirmed')`;
      await admin`insert into appointments (tenant_id,professional_id,client_id,service_id,starts_at,ends_at,price_cents,status)
        values (${t},${prof},${c},${s},${later},${h(later, 1)},5000,'cancelled')`;
      await admin`insert into blocks (tenant_id,professional_id,starts_at,ends_at,source,reason)
        values (${t},${prof},${later},${h(later, 1)},'google','Reunião do Google')`;
    }
    // bloqueios do app: um da Bia, um da Ana e um do salão todo (professional_id nulo)
    await admin`insert into blocks (tenant_id,professional_id,starts_at,ends_at,source,reason)
      values (${A},${biaA},${h(day, 3)},${h(day, 4)},'app','Médico da Bia')`;
    await admin`insert into blocks (tenant_id,professional_id,starts_at,ends_at,source,reason)
      values (${A},${anaA},${h(day, 5)},${h(day, 6)},'app','Curso da Ana')`;
    await admin`insert into blocks (tenant_id,professional_id,starts_at,ends_at,source,reason)
      values (${A},null,${h(day, 7)},${h(day, 8)},'app','Feriado')`;
  });
  afterAll(async () => {
    await admin.end();
  });

  it("link trocado ou desligado: o hash antigo deixa de achar a profissional na hora", async () => {
    await admin`update professionals set calendar_token_hash = 'hash-a2' where id = ${anaA}`;
    expect(await feed.professionalByTokenHash("hash-a")).toBeNull();
    expect((await feed.professionalByTokenHash("hash-a2"))?.id).toBe(anaA);
    await admin`update professionals set calendar_token_hash = null where id = ${anaA}`;
    expect(await feed.professionalByTokenHash("hash-a2")).toBeNull();
    await admin`update professionals set calendar_token_hash = 'hash-a' where id = ${anaA}`;
  });

  it("acha a profissional pelo hash (com o salão) e não acha hash desconhecido", async () => {
    const p = (await feed.professionalByTokenHash("hash-a"))!;
    expect(p).toMatchObject({ id: anaA, tenantId: A, tenantName: "Studio A", hideNames: false });
    expect(await feed.professionalByTokenHash("nada")).toBeNull();
  });

  it("só a agenda da profissional do link (mais os bloqueios do salão), sem cancelados nem eventos do Google", async () => {
    const ana = await feed.feedIcs((await feed.professionalByTokenHash("hash-a"))!);
    expect(ana).toContain("SUMMARY:Ana · Corte");
    expect(ana).toContain("Curso da Ana");
    expect(ana).toContain("Feriado");
    expect(ana).not.toContain("Beatriz");
    expect(ana).not.toContain("Médico da Bia");
    expect(ana).not.toContain("Bia Lima");
    expect(ana).not.toContain("Reunião do Google");
    expect(ana.match(/BEGIN:VEVENT/g)).toHaveLength(3);

    const bia = await feed.feedIcs((await feed.professionalByTokenHash("hash-bia"))!);
    expect(bia).toContain("SUMMARY:Beatriz · Corte");
    expect(bia).toContain("Médico da Bia");
    expect(bia).toContain("Feriado");
    expect(bia).not.toContain("Ana");
    expect(bia).not.toContain("Curso da Ana");
    // salão com duas profissionais: o nome do calendário diz de quem é
    expect(ana).toContain("Studio A · Ana");
    expect(bia).toContain("Studio A · Bia");
  });

  it("nome oculto quando pedido; e outro salão nunca aparece", async () => {
    const p = (await feed.professionalByTokenHash("hash-a"))!;
    const hidden = await feed.feedIcs({ ...p, hideNames: true });
    expect(hidden).toContain("SUMMARY:Atendimento · Corte");
    expect(hidden).not.toContain("Ana ·");
    expect(hidden).not.toContain("Bia Lima");
    const b = await feed.feedIcs((await feed.professionalByTokenHash("hash-b"))!);
    expect(b).toContain("Bia · Corte");
    expect(b).not.toContain("Ana");
    expect(b).toContain("Studio B");
    expect(b).not.toContain("Studio B · Bruna"); // salão com uma profissional: nome como era
  });
});
