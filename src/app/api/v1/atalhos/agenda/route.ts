import { connection } from "next/server";
import { dayOf, falaAgenda, parseDia, publicRow } from "@/features/atalhos/core";
import { handleAtalho, loadRows } from "@/features/atalhos/server";
import { dayRange } from "@/lib/dates";

/** Atalhos/Siri: "agenda de hoje" (ou `?dia=amanha`). Só leitura, chave Bearer. */
export async function GET(req: Request) {
  await connection();
  const dia = parseDia(new URL(req.url).searchParams.get("dia")) ?? "hoje";
  return handleAtalho(req, async (tenantId, now) => {
    const rows = await loadRows(tenantId, dayRange(dayOf(dia, now)));
    return { fala: falaAgenda(dia, rows, now), dia, atendimentos: rows.map(publicRow) };
  });
}
