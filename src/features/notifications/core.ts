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
    });
  }
  if (!google) {
    avisos.push({
      id: "google",
      title: "Google Agenda não conectado",
      hint: "Os agendamentos não aparecem no seu calendário.",
      href: "/ajustes",
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

/** Abre a conversa com a cliente por cima da tela atual (ver messaging/ConversationHost). */
export const conversationHref = (clientId: string) => `?conversa=${clientId}`;

/**
 * Uma linha por cliente que respondeu ao aviso e a dona ainda não abriu a conversa: só confirmou, quer cancelar
 * ou quer remarcar. Mensagem solta não vira aviso (a conversa continua guardada).
 */
export function messageAvisos(unread: UnreadSummary[]): Aviso[] {
  return unread
    .filter((u) => u.lastIntent !== null)
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
    });
  }
  if (counts.toClose > 0) {
    avisos.push({
      id: "to-close",
      title: `${atendimentos(counts.toClose)} para fechar`,
      hint: "Já passaram: marque como concluído ou falta.",
      href: "/pendencias",
    });
  }
  if (counts.toConfirm > 0) {
    avisos.push({
      id: "to-confirm",
      title: `${atendimentos(counts.toConfirm)} sem confirmação`,
      hint: "A cliente ainda não confirmou o horário.",
      href: "/pendencias",
    });
  }
  if (counts.unsynced > 0) {
    avisos.push({
      id: "unsynced",
      title: `${atendimentos(counts.unsynced)} fora do Google Agenda`,
      hint: "Toque para tentar enviar de novo.",
      href: "/pendencias",
    });
  }
  return avisos;
}
