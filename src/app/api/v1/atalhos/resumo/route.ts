import { connection } from "next/server";
import { dayOf, falaResumo, parseDia } from "@/features/atalhos/core";
import { handleAtalho, loadRows } from "@/features/atalhos/server";
import { dayRange } from "@/lib/dates";

/** Atalhos/Siri: "resumo do dia" (ou `?dia=amanha`). Só leitura, chave Bearer. */
export async function GET(req: Request) {
  await connection();
  const dia = parseDia(new URL(req.url).searchParams.get("dia")) ?? "hoje";
  return handleAtalho(req, async (tenantId, now) => {
    const rows = await loadRows(tenantId, dayRange(dayOf(dia, now)));
    return { fala: falaResumo(dia, rows), dia, total: rows.filter((r) => r.status !== "no_show").length };
  });
}
