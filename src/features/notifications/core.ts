import type { IconName } from "@/components/ui/Icon";

/**
 * Cor do aviso, sempre junto de um ícone e do texto (a cor nunca é a única pista):
 * danger = algo parou de funcionar; warning = precisa de ação; success = deu certo; info = rotina da agenda.
 */
export type AvisoTone = "danger" | "warning" | "success" | "info";

export type Aviso = {
  /** Fixo por tipo; nas mensagens novas, `message-<cliente>`. */
  id:
    | "whatsapp"
    | "google"
    | "to-close"
    | "to-confirm"
    | "unsynced"
    | "to-reschedule"
    | `message-${string}`
    | `noreply-${string}`;
  title: string;
  hint: string;
  href: string;
  icon: IconName;
  tone: AvisoTone;
};

type Inputs = {
  /** "unavailable" = não deu para consultar a Evolution; não vira aviso para não alarmar à toa. */
  whatsapp: "open" | "other" | "unavailable";
  google: boolean;
};

/** Avisos do app sobre integrações que precisam de atenção da dona do estúdio. */
export function buildAvisos({ whatsapp, google }: Inputs): Aviso[] {
  const avisos: Aviso[] = [];
  if (whatsapp === "other") {
    avisos.push({
      id: "whatsapp",
      title: "WhatsApp desconectado",
      hint: "Os lembretes às clientes não saem até conectar de novo.",
      href: "/ajustes",
      icon: "wifiOff",
      tone: "danger",
    });
  }
  if (!google) {
    avisos.push({
      id: "google",
      title: "Google Agenda não conectado",
      hint: "Os agendamentos não aparecem no seu calendário.",
      href: "/ajustes",
      icon: "google",
      tone: "warning",
    });
  }
  return avisos;
}

type UnreadSummary = {
  clientId: string;
  clientName: string;
  count: number;
  lastBody: string;
  lastIntent: "confirm" | "cancel" | "reschedule" | null;
};

type Intent = NonNullable<UnreadSummary["lastIntent"]>;

/** Confirmou = verde; cancelar = vermelho; remarcar = âmbar. */
const INTENT_LOOK = {
  confirm: { icon: "checkCircle", tone: "success" },
  cancel: { icon: "userX", tone: "danger" },
  reschedule: { icon: "reschedule", tone: "warning" },
} as const satisfies Record<Intent, { icon: IconName; tone: AvisoTone }>;

/** Abre a conversa com a cliente por cima da tela atual (ver messaging/ConversationHost). */
export const conversationHref = (clientId: string) => `?conversa=${clientId}`;

/**
 * Uma linha por cliente que respondeu ao aviso e a dona ainda não abriu a conversa: só confirmou, quer cancelar
 * ou quer remarcar. Mensagem solta não vira aviso (a conversa continua guardada).
 */
export function messageAvisos(unread: UnreadSummary[]): Aviso[] {
  return unread
    .filter((u): u is UnreadSummary & { lastIntent: Intent } => u.lastIntent !== null)
    .map((u) => {
      const first = u.clientName.trim().split(/\s+/)[0];
      const what =
        u.lastIntent === "confirm"
          ? "confirmou o horário"
          : u.lastIntent === "cancel"
            ? "quer cancelar o horário"
            : "quer remarcar";
      return {
        id: `message-${u.clientId}` as const,
        title: `${first} ${what}`,
        hint:
          u.count > 1 ? `${u.count} mensagens novas · “${u.lastBody.slice(0, 60)}”` : `“${u.lastBody.slice(0, 80)}”`,
        href: conversationHref(u.clientId),
        ...INTENT_LOOK[u.lastIntent],
      };
    });
}

/** Quem não respondeu aos avisos (marcado pelo worker junto da notificação no celular). */
export function noReplyAvisos(rows: { id: string; clientId: string; clientName: string; time: string }[]): Aviso[] {
  return rows.map((r) => ({
    id: `noreply-${r.id}` as const,
    title: `${r.clientName.trim().split(/\s+/)[0]} não respondeu`,
    hint: `Ainda não confirmou o horário das ${r.time}. Toque para ver a conversa.`,
    href: conversationHref(r.clientId),
    icon: "message",
    tone: "warning",
  }));
}

const atendimentos = (n: number) => (n === 1 ? "1 atendimento" : `${n} atendimentos`);

/** Uma linha por tipo de pendência, só para os tipos que têm algo a resolver. */
export function pendenciaAvisos(counts: {
  toClose: number;
  toConfirm: number;
  unsynced: number;
  toReschedule: number;
}): Aviso[] {
  const avisos: Aviso[] = [];
  if (counts.toReschedule > 0) {
    avisos.push({
      id: "to-reschedule",
      title: counts.toReschedule === 1 ? "1 cliente quer remarcar" : `${counts.toReschedule} clientes querem remarcar`,
      hint: "Pediram para cancelar ou remarcar. Combine o melhor horário pela conversa.",
      href: "/pendencias",
      icon: "reschedule",
      tone: "warning",
    });
  }
  if (counts.toClose > 0) {
    avisos.push({
      id: "to-close",
      title: `${atendimentos(counts.toClose)} para fechar`,
      hint: "Já passaram: marque como concluído ou falta.",
      href: "/pendencias",
      icon: "checkCircle",
      tone: "info",
    });
  }
  if (counts.toConfirm > 0) {
    avisos.push({
      id: "to-confirm",
      title: `${atendimentos(counts.toConfirm)} sem confirmação`,
      hint: "A cliente ainda não confirmou o horário.",
      href: "/pendencias",
      icon: "clock",
      tone: "warning",
    });
  }
  if (counts.unsynced > 0) {
    avisos.push({
      id: "unsynced",
      title: `${atendimentos(counts.unsynced)} fora do Google Agenda`,
      hint: "Toque para tentar enviar de novo.",
      href: "/pendencias",
      icon: "refresh",
      tone: "warning",
    });
  }
  return avisos;
}
