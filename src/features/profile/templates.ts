/** Variáveis que a dona pode usar nos textos; viram os dados do agendamento na hora de enviar. */
export const VARIABLES = [
  { key: "{nome}", label: "Nome da cliente" },
  { key: "{servico}", label: "Serviço" },
  { key: "{dia}", label: "Dia" },
  { key: "{hora}", label: "Hora" },
  { key: "{studio}", label: "Nome do studio" },
] as const;

export const DEFAULT_CONFIRMATION =
  "Oi, {nome}! Seu horário de {servico} {dia} às {hora} está agendado. Responda 1 para confirmar. 💜";
export const DEFAULT_REMINDER =
  "Oi, {nome}! Passando para lembrar do seu horário de {servico} {dia} às {hora}. Te espero! 💜";

export const CATEGORIES = [
  "Manicure e pedicure",
  "Cabelo",
  "Barbearia",
  "Sobrancelha e cílios",
  "Estética",
  "Maquiagem",
  "Massagem e spa",
  "Outro",
] as const;

export const MAX_TEMPLATE = 600;

/** Troca {variáveis} pelos valores; o que não for reconhecido fica como está. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}
