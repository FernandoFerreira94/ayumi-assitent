import { z } from "zod";

export const serviceInput = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(60),
  durationMin: z.coerce.number().int().min(15).max(480),
  // aceita "150" ou "150,50"
  price: z
    .string()
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n >= 0 && n < 100000, "Valor inválido")
    .transform((n) => Math.round(n * 100)),
});
export type ServiceInput = { name: string; durationMin: number; price: number };
