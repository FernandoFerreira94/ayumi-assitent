import "server-only";
import { and, asc, eq, gte, isNull, lt, ne, or } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, blocks, clients, professionals, services, tenants } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import { buildIcs, eventTitle, type FeedEvent } from "./ics";

const DAY = 86_400_000;
/** Janela do link: o passado recente (consulta) e o futuro que a agenda costuma ter. */
export const FEED_WINDOW = { pastDays: 30, futureDays: 180 } as const;

/** Dona do link do feed: a profissional (e o salão dela) cujo hash bate. */
export type FeedOwner = { id: string; tenantId: string; tenantName: string; hideNames: boolean };

/**
 * Profissional dona do hash. Roda como dono do banco, sem estúdio ativo (o link é anônimo): professionals tem
 * FORCE RLS, então isto depende de o papel de conexão ignorar RLS, como a limpeza de retenção e a exclusão de conta.
 */
export async function professionalByTokenHash(hash: string): Promise<FeedOwner | null> {
  const [p] = await getDb()
    .select({
      id: professionals.id,
      tenantId: professionals.tenantId,
      tenantName: tenants.name,
      hideNames: professionals.calendarHideNames,
    })
    .from(professionals)
    .innerJoin(tenants, eq(tenants.id, professionals.tenantId))
    .where(eq(professionals.calendarTokenHash, hash))
    .limit(1);
  return p ?? null;
}

/** Estado do que a profissional liga em Ajustes > Calendários (nunca o link nem o hash). */
export async function calendarSettings(tenantId: string, professionalId: string) {
  const [p] = await withTenant(tenantId, (tx) =>
    tx
      .select({
        feedOn: professionals.calendarTokenHash,
        hideNames: professionals.calendarHideNames,
        icloudOn: professionals.icloudCalendarUrl,
      })
      .from(professionals)
      .where(eq(professionals.id, professionalId)),
  );
  return { feedOn: !!p?.feedOn, hideNames: p?.hideNames ?? false, icloudOn: !!p?.icloudOn };
}

/**
 * ICS da profissional: os agendamentos não cancelados dela e os bloqueios do app que valem para ela (os dela e
 * os do salão todo). Eventos vindos do Google/iCloud ficam de fora.
 */
export async function feedIcs(owner: FeedOwner, now = new Date()) {
  const from = new Date(now.getTime() - FEED_WINDOW.pastDays * DAY);
  const to = new Date(now.getTime() + FEED_WINDOW.futureDays * DAY);
  const { appts, blks, team } = await withTenant(owner.tenantId, async (tx) => ({
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
      .where(
        and(
          eq(appointments.professionalId, owner.id),
          gte(appointments.startsAt, from),
          lt(appointments.startsAt, to),
          ne(appointments.status, "cancelled"),
        ),
      )
      .orderBy(asc(appointments.startsAt)),
    blks: await tx
      .select({ id: blocks.id, startsAt: blocks.startsAt, endsAt: blocks.endsAt, reason: blocks.reason })
      .from(blocks)
      .where(
        and(
          eq(blocks.source, "app"),
          or(isNull(blocks.professionalId), eq(blocks.professionalId, owner.id)),
          gte(blocks.startsAt, from),
          lt(blocks.startsAt, to),
        ),
      ),
    team: await tx.select({ id: professionals.id, name: professionals.displayName }).from(professionals),
  }));
  // Salão com mais de uma profissional: o nome do calendário diz de quem é (senão os links se confundem no iPhone)
  const mine = team.find((t) => t.id === owner.id);
  const calName =
    team.length > 1 && mine ? `Bubbly · ${owner.tenantName} · ${mine.name}` : `Bubbly · ${owner.tenantName}`;
  const events: FeedEvent[] = [
    ...appts.map((a) => ({
      uid: `${a.id}@bubbly`,
      start: a.startsAt,
      end: a.endsAt,
      title: eventTitle({
        clientName: a.clientName,
        service: a.service,
        status: a.status,
        hideNames: owner.hideNames,
      }),
    })),
    ...blks.map((b) => ({
      uid: `block-${b.id}@bubbly`,
      start: b.startsAt,
      end: b.endsAt,
      title: b.reason?.trim() ? `Bloqueado · ${b.reason.trim()}` : "Bloqueado",
    })),
  ];
  return buildIcs({ calName, events, now });
}
