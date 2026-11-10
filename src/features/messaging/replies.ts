import { clientCall } from "@/features/reminders/text";
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

// Texto já normalizado (sem acento, minúsculo). Ordem importa: "nao vou" antes de "vou"
const RESCHEDULE = /\b(reagend\w*|remarc\w*|outro (horario|dia)|mudar (o )?horario|trocar (o )?horario)\b/;
const CANCEL = /\b(cancel\w*|desmarc\w*|nao (vou|posso|consigo|da)|nao vai dar|nao irei)\b/;
const CANCEL_ALL = new RegExp(CANCEL.source, "g");
// "não precisa cancelar", "não cancele", "não quero remarcar": negou a ação, então não é pedido nenhum
const NEGATED_ACTION =
  /\bnao (quero |precisa |preciso |vou |pode |va |me )?(cancel\w*|desmarc\w*|remarc\w*|reagend\w*)/;
// "não vou faltar": parece cancelamento pela palavra "não vou", mas é o contrário
const WILL_ATTEND = /\bnao (vou|iria) (faltar|esquecer|me esquecer|deixar de ir|perder)\b/;
const CONFIRM =
  /\b(o+k+a*y?|oks|si+m+|confirm\w*|certo|combinado|beleza|blz|pode ser|estarei|irei|vou sim|vou|claro|perfeito|fechado|fechou|ta bom|ta otimo|tudo certo|com certeza|certeza|pode deixar|pode crer|positivo|aham|uhum|isso|yes|show|top|dale|presente|ciente)\b/;
// Ressalva, dúvida, pergunta, adiamento ou ajuste de horário: "ok, mas dá pra ser às 15h?" não é confirmação
const HEDGE =
  /\b(mas|porem|talvez|se der|se puder|acho que|nao sei|depende|duvida|atras\w*|adiantar|vou ver|deixa eu ver|te (aviso|falo|retorno|confirmo)|depois|ainda|mais (tarde|cedo)|\d+ ?(h|hr|hrs|horas?|min|minutos?))\b/;
// O número só vale sozinho ("2", "opção 2"): em "posso ir às 2?" ele é hora, não opção
const OPTION = /^(opcao |numero )?([123]|um|dois|tres)$/;
const BY_OPTION: Record<string, Intent> = {
  "1": "confirm",
  um: "confirm",
  "2": "cancel",
  dois: "cancel",
  "3": "reschedule",
  tres: "reschedule",
};
// Só emojis de "sim"; tom de pele e seletores de variação não contam
const THUMBS = /^(\u{1F44D}|\u{1F44C}|✅|✔|💜|❤|\u{1F499}|\u{1F618})+$/u;
const EMOJI_NOISE = /[\u{1F3FB}-\u{1F3FF}️‍\s]/gu;

/**
 * Entende a resposta ao lembrete ("1/2/3" ou palavras do dia a dia). Só aceita quando a intenção é
 * clara: o resultado muda o status do agendamento e responde à cliente, então dúvida, negação,
 * pedido misto ("sim, cancela o outro") ou conversa voltam null e ficam para a dona ler e decidir.
 */
export function parseIntent(raw: string): Intent | null {
  const trimmed = raw.trim();
  if (THUMBS.test(trimmed.replace(EMOJI_NOISE, ""))) return "confirm";
  const t = plain(trimmed);
  // Texto longo costuma ser conversa (pergunta, recado): melhor a dona ler do que o sistema adivinhar
  if (!t || t.split(" ").length > 12) return null;
  const option = OPTION.exec(t);
  if (option) return BY_OPTION[option[2]];
  if (NEGATED_ACTION.test(t)) return null;
  const doubtful = trimmed.includes("?") || HEDGE.test(t);
  if (WILL_ATTEND.test(t)) return doubtful ? null : "confirm";
  if (RESCHEDULE.test(t)) return "reschedule";
  if (CANCEL.test(t)) {
    // "vou sim, mas cancela o outro": sem como saber a qual horário se refere
    // ("vou ter que cancelar" é só o jeito de dizer; o "vou" ali não confirma nada)
    const rest = t.replace(CANCEL_ALL, " ").replace(/\bvou (ter que|precisar)\b/g, " ");
    return CONFIRM.test(rest) ? null : "cancel";
  }
  // Qualquer "não" que sobrou ("não confirmo", "não esqueci") não é confirmação
  if (doubtful || /\bnao\b/.test(t)) return null;
  return CONFIRM.test(t) ? "confirm" : null;
}

/**
 * Única resposta automática à resposta do lembrete. Confirmar agradece; cancelar ou remarcar não muda
 * nada sozinho: só diz que a profissional vai ver o melhor horário e retornar.
 */
export function ackText(intent: Intent, clientName: string, fullName = false): string {
  const first = clientCall(clientName, fullName);
  if (intent === "confirm") return `Oba, ${first}! Seu horário está confirmado 💜 Te espero com carinho!`;
  return `Tudo bem, ${first}! Vou ver com a profissional o melhor horário para você e já te retorno 💜`;
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

/**
 * Mensagem do webhook "messages.upsert" da Evolution (v2), já filtrada. `media` marca áudio, foto ou
 * figurinha sem legenda: o texto vira um rótulo ("[áudio]") para aparecer na conversa.
 */
export type InboundText = {
  instance: string;
  externalId: string;
  fromMe: boolean;
  phoneDigits: string;
  text: string;
  media?: boolean;
};

type Key = { remoteJid?: string; remoteJidAlt?: string; senderPn?: string; fromMe?: boolean; id?: string };
type Upsert = {
  event?: string;
  instance?: string;
  data?: {
    key?: Key;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string };
      videoMessage?: { caption?: string };
      audioMessage?: object;
      stickerMessage?: object;
    };
  };
};

const jidDigits = (jid?: string) =>
  jid && /@s\.whatsapp\.net$/.test(jid) ? jid.split("@")[0].replace(/\D/g, "") : null;

/**
 * Tira do corpo do webhook só o que importa. Ignora grupos, status, mídia enviada pela própria dona e
 * contatos que só aparecem por LID (identificador sem telefone) quando não vem o número junto.
 */
export function parseUpsert(body: unknown): InboundText | null {
  const b = body as Upsert;
  if (!b || (b.event !== "messages.upsert" && b.event !== "MESSAGES_UPSERT") || !b.instance) return null;
  const key = b.data?.key;
  const m = b.data?.message;
  const text = m?.conversation ?? m?.extendedTextMessage?.text ?? m?.imageMessage?.caption ?? m?.videoMessage?.caption;
  const fromMe = key?.fromMe === true;
  const mediaLabel = m?.audioMessage
    ? "[áudio]"
    : m?.imageMessage
      ? "[foto]"
      : m?.videoMessage
        ? "[vídeo]"
        : m?.stickerMessage
          ? "[figurinha]"
          : null;
  const media = !text?.trim() && !!mediaLabel && !fromMe;
  if (!key?.id || (!text?.trim() && !media)) return null;
  const phoneDigits = jidDigits(key.remoteJid) ?? jidDigits(key.remoteJidAlt) ?? jidDigits(key.senderPn);
  if (!phoneDigits) return null;
  const base = { instance: b.instance, externalId: key.id, fromMe, phoneDigits };
  return media ? { ...base, text: mediaLabel!, media: true } : { ...base, text: text!.trim() };
}
