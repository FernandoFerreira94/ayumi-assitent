import { z } from "zod";

/** Tipos de salão para escolher em Ajustes; o valor é o que fica salvo no banco. */
export const BUSINESS_TYPES = [
  ["unhas", "Unhas"],
  ["cabelo", "Cabelo"],
  ["estetica", "Estética"],
  ["sobrancelhas_cilios", "Sobrancelhas e cílios"],
  ["maquiagem", "Maquiagem"],
  ["barbearia", "Barbearia"],
  ["depilacao", "Depilação"],
  ["massagem", "Massagem"],
  ["outro", "Outro"],
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number][0];

export const salonInput = z.object({
  name: z.string().trim().min(2, "Dê um nome ao salão").max(80),
  businessType: z.enum(BUSINESS_TYPES.map(([v]) => v) as [BusinessType, ...BusinessType[]]),
  // Vazio = volta ao texto padrão do lembrete
  reminderTemplate: z.string().trim().max(600, "Até 600 caracteres"),
});
export type SalonInput = z.infer<typeof salonInput>;
