import { z } from "zod";
import { toE164 } from "@/lib/phone";

/**
 * Segmentos de atuação (nomes como o mercado de beleza brasileiro usa). A pessoa pode marcar mais de um.
 * O valor é o que fica salvo no banco.
 */
export const SEGMENTS = [
  ["nail_designer", "Nail designer (manicure e pedicure)"],
  ["cabeleireiro", "Cabeleireiro(a) / hair stylist"],
  ["colorista", "Colorista"],
  ["trancista", "Trancista"],
  ["designer_sobrancelhas", "Designer de sobrancelhas"],
  ["lash_designer", "Lash designer (extensão de cílios)"],
  ["micropigmentador", "Micropigmentação"],
  ["esteticista", "Esteticista (facial e corporal)"],
  ["maquiador", "Maquiador(a)"],
  ["barbeiro", "Barbearia / barbeiro"],
  ["depilacao", "Depilação"],
  ["massoterapeuta", "Massoterapeuta"],
  ["podologo", "Podólogo(a)"],
  ["outro", "Outro"],
] as const;
export type Segment = (typeof SEGMENTS)[number][0];
const SEGMENT_IDS = SEGMENTS.map(([v]) => v) as [Segment, ...Segment[]];

/**
 * Número do WhatsApp conectado (E.164 vindo da Evolution) como telefone BR em E.164.
 * Celulares antigos chegam sem o 9 (ex.: +551187654321): o 9 volta para casar com o que a pessoa conhece.
 */
export function phoneFromWhatsapp(e164: string | null): string | null {
  // O número do WhatsApp sempre traz o DDI; só aceita Brasil (55) para não ler número de fora como BR.
  const digits = (e164 ?? "").replace(/\D/g, "");
  if (!digits.startsWith("55") || (digits.length !== 12 && digits.length !== 13)) return null;
  const local = digits.slice(2);
  return `+55${local.length === 10 && /^[6-9]$/.test(local[2] ?? "") ? `${local.slice(0, 2)}9${local.slice(2)}` : local}`;
}

export const salonInput = z.object({
  name: z.string().trim().min(2, "Dê um nome ao salão").max(80),
  ownerName: z.string().trim().max(80),
  // Vazio = sem telefone; senão vira E.164 (+55...)
  businessPhone: z
    .string()
    .trim()
    .refine((v) => v === "" || toE164(v) !== null, "Telefone com DDD")
    .transform((v) => (v === "" ? null : toE164(v))),
  segments: z.array(z.enum(SEGMENT_IDS)).min(1, "Marque pelo menos um segmento").max(SEGMENTS.length),
});
export type SalonInput = z.infer<typeof salonInput>;

/** Resposta automática por IA (sempre ligada): regras da profissional em texto livre. */
export const AI_RULES_MAX = 1000;
export const aiSettingsInput = z.object({
  aiRules: z.string().trim().max(AI_RULES_MAX, `Até ${AI_RULES_MAX} caracteres`),
});
