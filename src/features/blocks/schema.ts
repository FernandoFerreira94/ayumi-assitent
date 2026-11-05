import { z } from "zod";
import { isDateStr } from "@/lib/dates";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const blockInput = z
  .object({
    date: z.string().refine(isDateStr, "Data inválida"),
    start: z.string().regex(HHMM, "Horário inválido"),
    end: z.string().regex(HHMM, "Horário inválido"),
    reason: z
      .string()
      .trim()
      .max(80)
      .optional()
      .transform((v) => v || undefined),
  })
  .refine((v) => v.end > v.start, { path: ["end"], message: "O fim precisa ser depois do início" });
export type BlockInput = { date: string; start: string; end: string; reason?: string };
