import { z } from "zod";
import { toE164 } from "@/lib/phone";

export const clientInput = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  phone: z
    .string()
    .transform((v) => toE164(v))
    .refine((v): v is string => v !== null, "Telefone inválido"),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || undefined),
});
export type ClientInput = { name: string; phone: string; notes?: string };
