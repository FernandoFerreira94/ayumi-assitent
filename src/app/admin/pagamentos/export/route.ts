import { logAdminAccess } from "@/features/admin/audit";
import { toCsv } from "@/features/admin/csv";
import { requireAdmin } from "@/features/admin/guard";
import { parseMonth } from "@/features/admin/month";
import { getPayments } from "@/features/admin/queries";
import { METHOD_LABEL, PAY_STATUS } from "@/features/admin/ui/format";

const money = (c: number | null) => (c === null ? null : (c / 100).toFixed(2).replace(".", ","));
const day = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });

/** CSV do mês para o contador/Excel. Só admin com código em dia; cada exportação fica no registro de acessos. */
export async function GET(req: Request) {
  const { userId } = await requireAdmin();
  const now = new Date();
  const month = parseMonth(new URL(req.url).searchParams.get("mes"), now);
  await logAdminAccess({ userId, action: "export_payments", target: month });
  const payments = await getPayments(month, now);
  const csv = toCsv(
    ["Data", "Salão", "Plano", "Método", "Status", "Valor", "Taxa", "Líquido", "Id MP"],
    payments.map((p) => [
      day.format(p.paidAt ?? p.createdAt),
      p.salonName,
      p.planId,
      METHOD_LABEL[p.method],
      PAY_STATUS[p.status].label,
      money(p.amountCents),
      money(p.feeCents),
      money(p.netCents),
      p.providerPaymentId,
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bubbly-pagamentos-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
