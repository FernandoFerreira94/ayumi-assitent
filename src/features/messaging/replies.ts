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
const CONFIRM = /\b(ok|okay|sim|confirm\w*|certo|combinado|beleza|blz|pode ser|estarei|vou sim|vou|claro|perfeito|fechado)\b/;
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

// Depois de "Quer cancelar mesmo?": 1/sim/cancelar = cancela; 2/remarcar = remarca; "manter"/confirmação = fica
const KEEP = /\b(manter|mantenho|mantem|nao (quero )?cancel\w*|deixa (como )?(esta|ta)|vou sim|confirm\w*)\b/;
const ASK_BY_OPTION: Record<string, Intent> = { "1": "cancel", "2": "reschedule" };

/**
 * Resposta à pergunta "Quer cancelar mesmo ou prefere remarcar?". Os números aqui têm outro
 * sentido (1 = cancelar, 2 = remarcar). Texto que não casa volta null e a pergunta segue de pé.
 */
export function parseCancelFollowUp(raw: string): Intent | null {
  const t = plain(raw.trim());
  if (!t || t.split(" ").length > 12) return null;
  const option = OPTION.exec(t);
  if (option) return ASK_BY_OPTION[option[2]] ?? null;
  if (RESCHEDULE.test(t)) return "reschedule";
  if (KEEP.test(t)) return "confirm";
  if (CANCEL.test(t) || t === "sim" || t === "quero cancelar") return "cancel";
  return null;
}

/** Quanto tempo a pergunta de cancelamento espera a resposta; depois disso o horário segue como estava. */
export const CANCEL_ASK_TTL_MS = 12 * 3600_000;

/** Pergunta que sai quando a cliente pede para cancelar; o horário só é liberado depois da resposta. */
export const cancelAskText = (clientName: string) =>
  `${clientName.trim().split(/\s+/)[0]}, quer cancelar mesmo ou prefere remarcar?\n1 - Cancelar\n2 - Remarcar`;

/** Reforço único, ~3 h antes, para quem não respondeu ao lembrete. Nunca cancela sozinho. */
export const NUDGE_HOURS = 3;
export const nudgeText = (clientName: string) =>
  `Ainda não recebi sua confirmação, ${clientName.trim().split(/\s+/)[0]} 😊 Responda 1 para confirmar`;

/** Primeira mensagem livre da cliente (não é 1/2/3): avisa que a dona vai ler e responder. */
export const freeTextAck = (salonName?: string | null) =>
  salonName?.trim() ? `Recebi! ${salonName.trim()} vai te responder em breve 💜` : "Recebi! Já já te respondo 💜";

/** Agradecimento curto que sai na hora para a cliente. */
export function ackText(intent: Intent, clientName: string): string {
  const first = clientName.trim().split(/\s+/)[0];
  if (intent === "confirm") return `Obrigada, ${first}! Seu horário está confirmado. Até lá! 💜`;
  if (intent === "cancel") return `Tudo bem, ${first}. Cancelei seu horário. Quando quiser marcar outro, é só chamar. 💜`;
  return `Certo, ${first}! Já avisei aqui e vou te chamar para combinar um novo horário. 💜`;
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

const jidDigits = (jid?: string) => (jid && /@s\.whatsapp\.net$/.test(jid) ? jid.split("@")[0].replace(/\D/g, "") : null);

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
