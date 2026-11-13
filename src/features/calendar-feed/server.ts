import "server-only";
import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, blocks, clients, services, tenants } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import { buildIcs, eventTitle, type FeedEvent } from "./ics";

const DAY = 86_400_000;
/** Janela do link: o passado recente (consulta) e o futuro que a agenda costuma ter. */
export const FEED_WINDOW = { pastDays: 30, futureDays: 180 } as const;

/** Estúdio dono do hash. Roda como dono do banco: tenants não tem FORCE RLS (igual ao webhook do WhatsApp). */
export async function tenantByTokenHash(hash: string) {
  const [t] = await getDb()
    .select({ id: tenants.id, name: tenants.name, hideNames: tenants.calendarHideNames })
    .from(tenants)
    .where(eq(tenants.calendarTokenHash, hash))
    .limit(1);
  return t ?? null;
}

/** ICS do estúdio: agendamentos não cancelados e bloqueios do app. Eventos vindos do Google ficam de fora. */
export async function feedIcs(tenant: { id: string; name: string; hideNames: boolean }, now = new Date()) {
  const from = new Date(now.getTime() - FEED_WINDOW.pastDays * DAY);
  const to = new Date(now.getTime() + FEED_WINDOW.futureDays * DAY);
  const { appts, blks } = await withTenant(tenant.id, async (tx) => ({
    appts: await tx
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
        clientName: clients.name,
        service: serviceLabel,
      })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(and(gte(appointments.startsAt, from), lt(appointments.startsAt, to), ne(appointments.status, "cancelled")))
      .orderBy(asc(appointments.startsAt)),
    blks: await tx
      .select({ id: blocks.id, startsAt: blocks.startsAt, endsAt: blocks.endsAt, reason: blocks.reason })
      .from(blocks)
      .where(and(eq(blocks.source, "app"), gte(blocks.startsAt, from), lt(blocks.startsAt, to))),
  }));
  const events: FeedEvent[] = [
    ...appts.map((a) => ({
      uid: `${a.id}@bubbly`,
      start: a.startsAt,
      end: a.endsAt,
      title: eventTitle({
        clientName: a.clientName,
        service: a.service,
        status: a.status,
        hideNames: tenant.hideNames,
      }),
      updated: now,
    })),
    ...blks.map((b) => ({
      uid: `block-${b.id}@bubbly`,
      start: b.startsAt,
      end: b.endsAt,
      title: b.reason?.trim() ? `Bloqueado · ${b.reason.trim()}` : "Bloqueado",
      updated: now,
    })),
  ];
  return buildIcs({ calName: `Bubbly · ${tenant.name}`, events, now });
}
