/**
 * Passos do tour de primeiro acesso. Fica todo em Ajustes: uma saudação e depois cada linha da lista, na ordem em
 * que a dona deve configurar (conexões, mensagens, horários). `target` é um seletor (pode casar vários elementos:
 * o destaque cobre todos); `path` leva à tela do passo. "tap" só avança quando a pessoa toca no destaque; "next"
 * tem botão.
 */
export type TourStep = {
  target?: string;
  /** Tela onde o passo acontece; sem `path`, fica onde está. */
  path?: "/ajustes";
  title: string;
  text: string;
  advance: "next" | "tap";
  /** Passo que só faz sentido se o destaque existir (ex.: instalar o app, que some depois de instalado). */
  optional?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/ajustes",
    title: "Oi, eu sou o Bubbly!",
    text: "Vamos direto para Ajustes: é aqui que você liga as conexões e deixa as mensagens do seu jeito. Vou te mostrar o que configurar, um por um.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-whatsapp",
    title: "1. Conecte o WhatsApp",
    text: "É pelo WhatsApp do salão que saem a confirmação do agendamento e os avisos às clientes. Toque aqui, ligue e use o código no seu celular.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-calendarios",
    title: "2. Ligue seus calendários",
    text: "Conecte o Google Agenda ou o Calendário do iPhone: seus agendamentos aparecem lá e os compromissos de lá bloqueiam a agenda do Bubbly.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-notificacoes",
    title: "3. Ligue a Notificação",
    text: "Ligue os avisos neste celular e deixe a localização ligada: eu mando bom dia antes da primeira cliente, com a previsão do tempo, e aviso quando uma cliente responde.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-mensagens",
    title: "4. Edite suas mensagens",
    text: "Escreva a mensagem do agendamento, o 1º e o 2º aviso, e escolha como chamar a cliente. A IA lê as respostas e te avisa quem confirmou, cancelou ou quer remarcar.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-expediente",
    title: "5. Seus horários",
    text: "Marque os dias e horários em que você atende e a pausa do almoço. As vagas e a agenda seguem esses horários.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "[data-tour='install']",
    optional: true,
    title: "Instale o app no celular",
    text: "Toque neste ícone e siga o passo a passo para pôr o app na tela de início. Só instalado ele avisa você das respostas das clientes, mesmo fechado.",
    advance: "next",
  },
  {
    path: "/ajustes",
    title: "Agora é com você!",
    text: "Toque em cada linha e configure. O selo amarelo mostra o que ainda falta, e o tour fica no fim de Ajustes se quiser rever.",
    advance: "next",
  },
];

export type Box = { top: number; left: number; width: number; height: number };

/** Caixa que cobre todos os retângulos visíveis, com folga; null quando nenhum está na tela. */
export function unionBox(rects: Box[], pad = 8): Box | null {
  const seen = rects.filter((r) => r.width > 0 && r.height > 0);
  if (seen.length === 0) return null;
  const top = Math.min(...seen.map((r) => r.top)) - pad;
  const left = Math.min(...seen.map((r) => r.left)) - pad;
  const bottom = Math.max(...seen.map((r) => r.top + r.height)) + pad;
  const right = Math.max(...seen.map((r) => r.left + r.width)) + pad;
  return { top, left, width: right - left, height: bottom - top };
}
