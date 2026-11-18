import { connection } from "next/server";
import { falaProxima, nextOf, publicRow } from "@/features/atalhos/core";
import { handleAtalho, loadRows } from "@/features/atalhos/server";
import { addDays, dayRange, todayStr } from "@/lib/dates";

/** Atalhos/Siri: "próxima cliente" (hoje e os próximos 7 dias). Só leitura, chave Bearer. */
export async function GET(req: Request) {
  await connection();
  return handleAtalho(req, async (tenantId, now) => {
    const today = todayStr(now);
    const rows = await loadRows(tenantId, [dayRange(today)[0], dayRange(addDays(today, 7))[1]]);
    const next = nextOf(rows, now);
    return { fala: falaProxima(rows, now), proxima: next ? publicRow(next) : null };
  });
}
