// Textos dos avisos do dono (puros, testáveis). Nada de nome de salão, pessoa ou cliente no push:
// o texto passa pelos servidores da Apple/Google. O detalhe fica no painel (2FA).
import type { PushPayload } from "@/features/push/port";

export type Digest = {
  /** Salões criados ontem (dia de UTC-3). */
  newSalons: number;
  /** Salões com alguém da equipe usando o app ontem. */
  activeSalons: number;
  appointments: number;
  messagesOut: number;
  /** Salões com WhatsApp ligado no app mas desconectado na Evolution (lembretes não saem). */
  whatsappDown: number;
  /** Salões sem uso há mais de 7 dias (não contam os de menos de 7 dias de cadastro). */
  idleSalons: number;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function signupAlert(): PushPayload {
  return {
    title: "Bubbly Admin",
    body: "Novo salão cadastrado. Toque para ver no painel.",
    url: "/admin/uso",
    tag: "admin-signup",
  };
}

/** Resumo da manhã. Alerta (WhatsApp caído) vai na frente, porque é o que pede ação. */
export function digestAlert(d: Digest): PushPayload {
  const parts: string[] = [];
  if (d.whatsappDown) parts.push(`⚠️ ${plural(d.whatsappDown, "salão com WhatsApp caído", "salões com WhatsApp caído")}`);
  if (d.newSalons) parts.push(plural(d.newSalons, "salão novo", "salões novos"));
  parts.push(`${plural(d.activeSalons, "salão usou", "salões usaram")} o app ontem`);
  parts.push(`${plural(d.appointments, "agendamento", "agendamentos")} e ${plural(d.messagesOut, "mensagem", "mensagens")}`);
  if (d.idleSalons) parts.push(plural(d.idleSalons, "salão parado há 7+ dias", "salões parados há 7+ dias"));
  return {
    title: d.whatsappDown ? "Bubbly Admin · atenção" : "Bubbly Admin · ontem",
    body: parts.join(" · "),
    url: "/admin/uso",
    tag: "admin-digest",
  };
}
