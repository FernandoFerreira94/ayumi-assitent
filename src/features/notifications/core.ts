export type Aviso = {
  id: "whatsapp" | "google" | "to-close" | "to-confirm" | "unsynced";
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

const atendimentos = (n: number) => (n === 1 ? "1 atendimento" : `${n} atendimentos`);

/** Uma linha por tipo de pendência, só para os tipos que têm algo a resolver. */
export function pendenciaAvisos(counts: { toClose: number; toConfirm: number; unsynced: number }): Aviso[] {
  const avisos: Aviso[] = [];
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
