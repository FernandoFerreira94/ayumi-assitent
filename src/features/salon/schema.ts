import { z } from "zod";

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

/** Idade em anos completos hoje a partir de "AAAA-MM-DD"; null se a data não existir ou for futura. */
export function ageFrom(birth: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age--;
  return age >= 0 && age <= 120 ? age : null;
}

export const salonInput = z.object({
  name: z.string().trim().min(2, "Dê um nome ao salão").max(80),
  ownerName: z.string().trim().max(80),
  // Vazio = sem data
  birthDate: z
    .string()
    .trim()
    .refine((v) => v === "" || ageFrom(v) !== null, "Data inválida"),
  profession: z.string().trim().max(60),
  segments: z.array(z.enum(SEGMENT_IDS)).min(1, "Marque pelo menos um segmento").max(SEGMENTS.length),
});
export type SalonInput = z.infer<typeof salonInput>;

/** Texto do lembrete que vai para a cliente (vazio = volta ao padrão). */
export const reminderTemplateInput = z.object({
  reminderTemplate: z.string().trim().max(600, "Até 600 caracteres"),
});
