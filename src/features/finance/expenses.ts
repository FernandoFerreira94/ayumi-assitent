import { z } from "zod";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { expenses } from "@/db/schema";
import { isDateStr } from "@/lib/dates";
import { topSlices, type Slice } from "./summary";

export const EXPENSE_CATEGORIES = [
  ["produtos", "Produtos"],
  ["aluguel", "Aluguel"],
  ["contas", "Contas"],
  ["equipe", "Equipe"],
  ["marketing", "Marketing"],
  ["outros", "Outros"],
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number][0];
export const categoryLabel = (id: string) => EXPENSE_CATEGORIES.find(([v]) => v === id)?.[1] ?? "Outros";

export const expenseInput = z.object({
  spentOn: z.string().refine(isDateStr, "Data inválida"),
  // aceita "150" ou "150,50"; precisa ser maior que zero
  amount: z
    .string()
    .trim()
    .min(1)
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n > 0 && n < 100000, "Valor inválido")
    .transform((n) => Math.round(n * 100)),
  category: z.enum(EXPENSE_CATEGORIES.map(([v]) => v) as [ExpenseCategory, ...ExpenseCategory[]]),
  note: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || undefined),
});
export type ExpenseInput = z.output<typeof expenseInput>;

export type ExpenseRow = { id: string; spentOn: string; amountCents: number; category: string; note: string | null };

/** Gastos com data entre `from` (inclusive) e `to` (exclusivo), YYYY-MM-DD; os mais recentes primeiro. */
export const listExpenses = (tx: Tx, from: string, to: string): Promise<ExpenseRow[]> =>
  tx
    .select({
      id: expenses.id,
      spentOn: expenses.spentOn,
      amountCents: expenses.amountCents,
      category: expenses.category,
      note: expenses.note,
    })
    .from(expenses)
    .where(and(gte(expenses.spentOn, from), lt(expenses.spentOn, to)))
    .orderBy(desc(expenses.spentOn), desc(expenses.createdAt));

export const insertExpense = (tx: Tx, tenantId: string, v: ExpenseInput) =>
  tx.insert(expenses).values({
    tenantId,
    spentOn: v.spentOn,
    amountCents: v.amount,
    category: v.category,
    note: v.note ?? null,
  });

export const removeExpense = (tx: Tx, id: string) =>
  tx.delete(expenses).where(eq(expenses.id, id)).returning({ id: expenses.id });

/** Pizza dos gastos por categoria, no mesmo formato da dos serviços (até 5 fatias + Outros). */
export function expenseSlices(rows: Pick<ExpenseRow, "category" | "amountCents">[]): Slice[] {
  const by = new Map<string, number>();
  for (const r of rows) by.set(categoryLabel(r.category), (by.get(categoryLabel(r.category)) ?? 0) + r.amountCents);
  return topSlices([...by].map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents));
}
