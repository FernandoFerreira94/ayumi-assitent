// Regras puras do suporte e dos avisos do dono (testáveis sem banco).
import { z } from "zod";
import type { PushPayload } from "@/features/push/port";

/** Mensagens que um salão pode mandar por hora (protege o celular do dono de enxurrada). */
export const SUPPORT_MAX_PER_HOUR = 10;
export const SUPPORT_MAX_LEN = 2000;

export const supportBody = z
  .string()
  .transform((s) => s.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim())
  .pipe(z.string().min(1).max(SUPPORT_MAX_LEN));

export const noticeInput = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(400),
  tone: z.enum(["info", "important"]).default("info"),
  /** Dias até sair sozinho; vazio = fica até encerrar. */
  days: z.union([z.literal(""), z.coerce.number().int().min(1).max(60)]).optional(),
});
export type NoticeInput = z.infer<typeof noticeInput>;

export type SupportMessage = {
  id: string;
  author: "salon" | "admin";
  body: string;
  createdAt: Date;
  readAt: Date | null;
};

export type PlatformNotice = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "important";
  endsAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
};

/** Aviso aparece no Painel enquanto não foi encerrado nem passou da data. */
export function isNoticeLive(n: Pick<PlatformNotice, "endsAt" | "endedAt">, now: Date): boolean {
  return !n.endedAt && (!n.endsAt || n.endsAt > now);
}

export function noticeEndsAt(days: number | "" | undefined, now: Date): Date | null {
  return typeof days === "number" ? new Date(now.getTime() + days * 86_400_000) : null;
}

/** Linha da lista de conversas: uma frase só, cortada sem quebrar palavra no meio. */
export function preview(body: string, max = 90): string {
  const one = body.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one;
  const cut = one.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

const TZ = "America/Sao_Paulo";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const hourFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const shortFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });

/** Quando, como na lista do WhatsApp: hoje = hora, ontem = "Ontem", antes = dia/mês (fuso do Brasil). */
export function whenLabel(d: Date, now: Date): string {
  if (dayKey(d) === dayKey(now)) return hourFmt.format(d);
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return "Ontem";
  return shortFmt.format(d);
}

export type Conversation = {
  tenantId: string;
  salonName: string;
  lastBody: string;
  lastAuthor: "salon" | "admin";
  lastAt: Date;
  unread: number;
};

/** Sem resposta primeiro (a mais antiga esperando no topo); depois as demais, da mais recente. */
export function sortConversations(rows: Conversation[]): Conversation[] {
  const waiting = (c: Conversation) => c.lastAuthor === "salon";
  return [...rows].sort((a, b) => {
    if (waiting(a) !== waiting(b)) return waiting(a) ? -1 : 1;
    return waiting(a) ? a.lastAt.getTime() - b.lastAt.getTime() : b.lastAt.getTime() - a.lastAt.getTime();
  });
}

// Push sem nome de salão nem trecho da mensagem: o texto passa pelos servidores da Apple/Google.
export function newSupportAlert(tenantId: string): PushPayload {
  return {
    title: "Bubbly Admin",
    body: "Nova mensagem no suporte. Toque para responder.",
    url: `/admin/suporte?salao=${tenantId}`,
    tag: "admin-support",
  };
}

export function supportReplyAlert(): PushPayload {
  return { title: "bubbly", body: "O suporte respondeu sua mensagem.", url: "/ajustes/suporte", tag: "support-reply" };
}
