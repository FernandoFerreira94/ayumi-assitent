/**
 * Passos do tour de primeiro acesso, na Agenda. `target` é um seletor (pode casar vários elementos:
 * o destaque cobre todos). "tap" só avança quando a pessoa toca no destaque; "next" tem botão.
 */
export type TourStep = {
  target?: string;
  title: string;
  text: string;
  advance: "next" | "tap";
};

export const TOUR_STEPS: TourStep[] = [
  {
    title: "Oi, eu sou o Mimo!",
    text: "Vou te mostrar o principal do app em menos de um minuto.",
    advance: "next",
  },
  {
    target: "[data-tour='bubble']",
    title: "Seu dia num toque",
    text: "Aqui eu conto como está o dia: quantas clientes, quem falta confirmar. Toque em mim para ver a próxima informação.",
    advance: "tap",
  },
  {
    target: "[data-tour='days']",
    title: "Escolha o dia",
    text: "Toque num dia da semana. Arraste a faixa para o lado para trocar de semana.",
    advance: "next",
  },
  {
    target: "[data-tour='money']",
    title: "Agendar e bloquear",
    text: "Daqui você agenda uma cliente ou bloqueia um horário. Na agenda, segure um atendimento para arrastar ou toque num vazio para marcar.",
    advance: "next",
  },
  {
    target: ".fan-toggle",
    title: "O menu fica aqui",
    text: "Toque no botão para abrir o menu.",
    advance: "tap",
  },
  {
    target: ".fan[data-open] .fan-link",
    title: "Tudo a um toque",
    text: "Clientes, Vagas e Ajustes ficam no leque. O + do topo marca um horário de qualquer tela.",
    advance: "next",
  },
  {
    target: "[data-tour='bell']",
    title: "Avisos",
    text: "No sino aparecem as pendências: quem não confirmou, WhatsApp e Google desconectados.",
    advance: "next",
  },
  {
    title: "Pronto!",
    text: "Se quiser rever o tour, ele fica em Ajustes. Bom trabalho!",
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
