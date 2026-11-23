import { and, asc, gte, lt, notInArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments } from "@/db/schema";
import { addDays, dayRange, todayStr } from "@/lib/dates";
import { AHEAD_DAYS } from "./deposit-list";
import { appointmentRows } from "./pendencias";

/** Teto de linhas: 60 dias de agenda cheia ainda cabe com folga. */
const MAX_ROWS = 600;

/** Atendimentos de hoje até `AHEAD_DAYS` dias à frente, sem cancelados e faltas, por horário. */
export function listAhead(tx: Tx, now: Date) {
  const today = todayStr(now);
  const [from] = dayRange(today);
  const [, to] = dayRange(addDays(today, AHEAD_DAYS));
  return appointmentRows(tx)
    .where(
      and(
        gte(appointments.startsAt, from),
        lt(appointments.startsAt, to),
        notInArray(appointments.status, ["cancelled", "no_show"]),
      ),
    )
    .orderBy(asc(appointments.startsAt))
    .limit(MAX_ROWS);
}
