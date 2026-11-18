import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { withTenant } from "@/db/client";
import { clients } from "@/db/schema";
import { weekOf } from "@/features/appointments/agenda-grid";
import { forecastCents, listDay, receivedCents } from "@/features/appointments/core";
import { countPendencias, listPendencias } from "@/features/appointments/pendencias";
import { listBlocks } from "@/features/blocks/core";
import { loadYearDays } from "@/features/calendar/data";
import { clientSummary, listDueReturns } from "@/features/clients/core";
import { listExpenses } from "@/features/finance/expenses";
import { connectedProfessionalIds } from "@/features/google/server";
import { getHours } from "@/features/hours/core";
import { freeSlots, weekdayOf } from "@/features/hours/slots";
import { daysBetween } from "@/features/returns/rules";
import { listBookable } from "@/features/services/core";
import { addDays, dayRange, formatShortDate, todayStr } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";
import { confirmations, deltaPct, pickNext, sameDayPrevMonth } from "./rules";

const sum = (rows: { priceCents: number; status: Parameters<typeof receivedCents>[0][number]["status"] }[]) => ({
  received: receivedCents(rows),
  forecast: forecastCents(rows),
  count: rows.filter((r) => r.status !== "no_show").length,
});

/** Até quantos horários livres cada dia mostra no Painel (o resto está em Vagas). */
const SLOTS_SHOWN = 8;

/**
 * Tudo o que o Painel do desktop/tablet mostra além do dia: números da semana e do mês, próxima cliente,
 * pendências, retornos para chamar, vagas de hoje e amanhã, o ano (mini mês) e a semana do dia escolhido.
 * `cache`: as caixas da tela chamam em separado e o banco é consultado uma vez por pedido.
 */
export const loadDashboard = cache(async (tenantId: string, date: string) => {
  const now = new Date();
  const today = todayStr(now);
  const month = today.slice(0, 7);
  const thisWeek = weekOf(today);
  const viewWeek = weekOf(date);
  const prevMonth = sameDayPrevMonth(today).slice(0, 7);
  const googleProfessionals = await connectedProfessionalIds(tenantId);

  return withTenant(tenantId, async (tx) => {
    const span = (from: string, to: string): [Date, Date] => [dayRange(from)[0], dayRange(to)[1]];
    const [weekRows, monthRows, prevRows, viewRows, nearRows, nearBlocks, expenses, hours, services, pend, due, year] =
      await Promise.all([
        listDay(tx, span(thisWeek[0], thisWeek[6])),
        listDay(tx, span(`${month}-01`, today)),
        listDay(tx, span(`${prevMonth}-01`, sameDayPrevMonth(today))),
        listDay(tx, span(viewWeek[0], viewWeek[6])),
        listDay(tx, span(today, addDays(today, 1))),
        listBlocks(tx, span(today, addDays(today, 1))),
        listExpenses(tx, `${month}-01`, addDays(today, 1)),
        getHours(tx),
        listBookable(tx),
        listPendencias(tx, now, googleProfessionals),
        listDueReturns(tx, addDays(today, -30), addDays(today, 7), now),
        loadYearDays(tx, date.slice(0, 4)),
      ]);

    // Próxima cliente do dia escolhido (outro dia: a primeira dele)
    const dayRows = viewRows.filter((r) => todayStr(r.startsAt) === date);
    const picked = pickNext(dayRows, date === today ? now : dayRange(date)[0]);
    let next = null;
    if (picked) {
      const r = picked.row;
      const [summary, [extra]] = await Promise.all([
        clientSummary(tx, r.clientId, now),
        tx.select({ notes: clients.notes }).from(clients).where(eq(clients.id, r.clientId)),
      ]);
      next = {
        appointmentId: r.id,
        clientId: r.clientId,
        clientName: r.clientName,
        phone: maskPhone(r.clientPhone.replace(/^\+55/, "")),
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        serviceColor: r.serviceColor,
        priceCents: r.priceCents,
        status: r.status,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        current: picked.current,
        after: picked.after ? { name: picked.after.clientName, startsAt: picked.after.startsAt } : null,
        visits: summary.visits,
        spentCents: summary.spentCents,
        noShows: summary.noShows,
        lastVisit: summary.history.find((h) => todayStr(h.startsAt) < date) ?? null,
        clientNotes: extra?.notes ?? null,
        appointmentNotes: r.notes,
      };
    }

    // Vagas: o primeiro serviço que aparece em Vagas (igual à tela de Vagas)
    const service = services.find((s) => s.showInSlots) ?? null;
    const busy = [...nearRows.map((a) => ({ startsAt: a.startsAt, endsAt: a.blockedUntil })), ...nearBlocks];
    const slots = service
      ? [today, addDays(today, 1)].map((d) => ({
          date: d,
          times: freeSlots({
            date: d,
            day: hours[weekdayOf(d)],
            durationMin: service.durationMin + service.bufferMin,
            busy,
            notBefore: d === today ? now : undefined,
          }).slice(0, SLOTS_SHOWN),
        }))
      : [];

    const monthSum = sum(monthRows);
    const prevSum = sum(prevRows);
    const spent = expenses.reduce((s, e) => s + e.amountCents, 0);
    const todayRows = nearRows.filter((r) => todayStr(r.startsAt) === today);

    return {
      today,
      week: sum(weekRows),
      month: { ...monthSum, label: month, balance: monthSum.received - spent, delta: deltaPct(monthSum.received, prevSum.received) },
      confirm: confirmations(todayRows),
      next,
      pend: {
        total: countPendencias(pend),
        toClose: pend.toClose.length,
        toConfirm: pend.toConfirm.length,
        unsynced: pend.unsynced.length,
        toReschedule: pend.toReschedule.slice(0, 3).map((r) => ({ id: r.id, name: r.clientName, startsAt: r.startsAt })),
      },
      due: due.map((r) => ({
        appointmentId: r.appointmentId,
        clientId: r.clientId,
        name: r.name,
        phone: maskPhone(r.phoneE164.replace(/^\+55/, "")),
        service: r.service,
        dayLabel: formatShortDate(r.due!),
        lateDays: daysBetween(r.due!, today),
      })),
      slots: service ? { serviceId: service.id, serviceName: service.name, days: slots } : null,
      year,
      closedDays: hours.map((h) => !h),
      viewWeek: viewWeek.map((d) => ({
        date: d,
        closed: !hours[weekdayOf(d)],
        rows: viewRows
          .filter((r) => todayStr(r.startsAt) === d)
          .map((r) => ({ id: r.id, startsAt: r.startsAt, name: r.clientName, color: r.serviceColor, status: r.status, priceCents: r.priceCents })),
      })),
    };
  });
});

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;
