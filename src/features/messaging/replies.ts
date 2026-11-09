/** O que a cliente quis dizer ao responder o lembrete. */
export type Intent = "confirm" | "cancel" | "reschedule";

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

// Ordem importa: "nao vou" antes de "vou"; "remarcar" e "cancelar" antes do "ok" que pode vir junto
const RESCHEDULE = /\b(reagend\w*|remarc\w*|outro (horario|dia)|mudar (o )?horario|trocar (o )?horario)\b/;
const CANCEL = /\b(cancel\w*|desmarc\w*|nao (vou|posso|consigo|da)|nao vai dar)\b/;
const CONFIRM =
  /\b(ok|okay|sim|confirm\w*|certo|combinado|beleza|blz|pode ser|estarei|vou sim|vou|claro|perfeito|fechado)\b/;
// O número só vale sozinho ("2", "opção 2"): em "posso ir às 2?" ele é hora, não opção
const OPTION = /^(opcao |numero )?([123])$/;
const BY_OPTION: Record<string, Intent> = { "1": "confirm", "2": "cancel", "3": "reschedule" };
const THUMBS = /^(\u{1F44D}|\u{1F44C}|✅|✔️?)+$/u;

/**
 * Entende a resposta ao lembrete ("1/2/3" ou palavras do dia a dia). Mensagem longa ou que não casa
 * com nada volta null: fica só na conversa e no aviso, sem mexer no agendamento.
 */
export function parseIntent(raw: string): Intent | null {
  const trimmed = raw.trim();
  if (THUMBS.test(trimmed.replace(/\s/g, ""))) return "confirm";
  const t = plain(trimmed);
  // Texto longo costuma ser conversa (pergunta, recado): melhor a dona ler do que o sistema adivinhar
  if (!t || t.split(" ").length > 12) return null;
  const option = OPTION.exec(t);
  if (option) return BY_OPTION[option[2]];
  if (RESCHEDULE.test(t)) return "reschedule";
  if (CANCEL.test(t)) return "cancel";
  if (CONFIRM.test(t)) return "confirm";
  return null;
}

/** 2º aviso (horas definidas pela dona) para quem não respondeu ao lembrete. Nunca cancela sozinho. */
export const nudgeText = (clientName: string) =>
  `Ainda não recebi sua confirmação, ${clientName.trim().split(/\s+/)[0]} 😊 Responda 1 para confirmar`;

/**
 * Única resposta automática à resposta do lembrete. Confirmar agradece; cancelar ou remarcar não muda
 * nada sozinho: só diz que a profissional vai ver o melhor horário e retornar.
 */
export function ackText(intent: Intent, clientName: string): string {
  const first = clientName.trim().split(/\s+/)[0];
  if (intent === "confirm") return `Obrigada, ${first}! Seu horário está confirmado. Até lá! 💜`;
  return `Certo, ${first}! Vou verificar com a profissional o melhor horário para você e já te retorno. 💜`;
}

/**
 * Números possíveis de um telefone brasileiro vindo do WhatsApp: o WhatsApp às vezes manda
 * celular sem o nono dígito (55 11 8765-4321), e a cliente foi cadastrada com ele (55 11 98765-4321).
 */
export function phoneCandidates(digits: string): string[] {
  const d = digits.replace(/\D/g, "");
  const out = new Set([`+${d}`]);
  const br = /^55(\d{2})(\d{8,9})$/.exec(d);
  if (br) {
    const [, ddd, n] = br;
    if (n.length === 8 && /^[6-9]/.test(n)) out.add(`+55${ddd}9${n}`);
    if (n.length === 9 && n.startsWith("9")) out.add(`+55${ddd}${n.slice(1)}`);
  }
  return [...out];
}

/** Mensagem de texto do webhook "messages.upsert" da Evolution (v2), já filtrada. */
export type InboundText = { instance: string; externalId: string; fromMe: boolean; phoneDigits: string; text: string };

type Key = { remoteJid?: string; remoteJidAlt?: string; senderPn?: string; fromMe?: boolean; id?: string };
type Upsert = {
  event?: string;
  instance?: string;
  data?: { key?: Key; message?: { conversation?: string; extendedTextMessage?: { text?: string } } };
};

const jidDigits = (jid?: string) =>
  jid && /@s\.whatsapp\.net$/.test(jid) ? jid.split("@")[0].replace(/\D/g, "") : null;

/**
 * Tira do corpo do webhook só o que importa. Ignora grupos, status, áudio/foto sem legenda e
 * contatos que só aparecem por LID (identificador sem telefone) quando não vem o número junto.
 */
export function parseUpsert(body: unknown): InboundText | null {
  const b = body as Upsert;
  if (!b || (b.event !== "messages.upsert" && b.event !== "MESSAGES_UPSERT") || !b.instance) return null;
  const key = b.data?.key;
  const text = b.data?.message?.conversation ?? b.data?.message?.extendedTextMessage?.text;
  if (!key?.id || !text?.trim()) return null;
  const phoneDigits = jidDigits(key.remoteJid) ?? jidDigits(key.remoteJidAlt) ?? jidDigits(key.senderPn);
  if (!phoneDigits) return null;
  return { instance: b.instance, externalId: key.id, fromMe: key.fromMe === true, phoneDigits, text: text.trim() };
}
