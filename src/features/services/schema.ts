import { z } from "zod";
import { BUFFER_OPTIONS, SERVICE_COLORS, type ServiceColor } from "./catalog";

// Checkbox de formulário: presente = "on", ausente = desligado
const flag = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const serviceInput = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(60),
  // de 15 em 15 min, como no seletor
  durationMin: z.coerce.number().int().min(15).max(480).multipleOf(15),
  // aceita "150" ou "150,50"; vazio não vale (0 vale, para cortesia)
  price: z
    .string()
    .trim()
    .min(1)
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n >= 0 && n < 100000, "Valor inválido")
    .transform((n) => Math.round(n * 100)),
  priceFrom: flag,
  bufferMin: z.coerce
    .number()
    .int()
    .refine((n) => (BUFFER_OPTIONS as readonly number[]).includes(n)),
  color: z.enum(Object.keys(SERVICE_COLORS) as [ServiceColor, ...ServiceColor[]]),
  notes: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(300).nullable()),
  bookable: flag,
  showInSlots: flag,
});
export type ServiceInput = z.infer<typeof serviceInput>;
