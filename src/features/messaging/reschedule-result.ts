/**
 * Resultado do aviso de remarcação. Arquivo sem banco: a tela usa para escrever o toast.
 * sent = a cliente recebeu; unchanged = o horário é o que ela já conhece (ex.: arrastou e desfez);
 * none = nada pendente (já saiu, outro aparelho mandou, atendimento passou ou foi cancelado);
 * off = aviso desligado em Ajustes; opted_out = a cliente respondeu SAIR; no_whatsapp = estúdio sem WhatsApp;
 * offline = WhatsApp desconectado; invalid_number = número sem WhatsApp; retry = falha temporária, o app tenta de
 * novo em alguns minutos; error = falha inesperada.
 */
export type RescheduleNoticeResult =
  | "sent"
  | "unchanged"
  | "none"
  | "off"
  | "opted_out"
  | "no_whatsapp"
  | "offline"
  | "invalid_number"
  | "retry"
  | "error";

export type NoticeToast = { kind: "success" | "warning" | "info"; title: string; description?: string } | null;

/** O que a dona vê depois de remarcar. null = nada a dizer (não mudou, desligado de propósito, sem WhatsApp). */
export function rescheduleNoticeToast(r: RescheduleNoticeResult | null | undefined, clientName: string): NoticeToast {
  const name = clientName.trim().split(/\s+/)[0] || "a cliente";
  switch (r) {
    case "sent":
      return { kind: "success", title: `${name} recebeu o aviso no WhatsApp`, description: "Com o novo dia e horário" };
    case "offline":
      return {
        kind: "warning",
        title: "Aviso não enviado: WhatsApp desconectado",
        description: `Reconecte em Ajustes e avise ${name} do novo horário`,
      };
    case "invalid_number":
      return { kind: "warning", title: "Aviso não enviado", description: `O número de ${name} não tem WhatsApp` };
    case "retry":
      return { kind: "warning", title: "O aviso não saiu agora", description: "O app tenta de novo em alguns minutos" };
    case "error":
      return { kind: "warning", title: "Aviso não enviado", description: `Avise ${name} do novo horário` };
    case "opted_out":
      return {
        kind: "info",
        title: "Sem aviso no WhatsApp",
        description: `${name} pediu para não receber mensagens automáticas`,
      };
    default:
      return null;
  }
}
