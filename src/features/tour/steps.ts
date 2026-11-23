/**
 * Passos do tour, que abre depois da entrada de primeiro acesso (horários, avisos, agenda e localização já feitos).
 * Fica todo em Ajustes: uma saudação, as duas linhas que ainda faltam (WhatsApp e mensagens) e o fim. `target` é um
 * seletor (pode casar vários elementos: o destaque cobre todos); `path` leva à tela do passo. "tap" só avança quando
 * a pessoa toca no destaque; "next" tem botão.
 */
export type TourStep = {
  target?: string;
  /** Tela onde o passo acontece; sem `path`, fica onde está. */
  path?: "/ajustes";
  title: string;
  text: string;
  advance: "next" | "tap";
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/ajustes",
    title: "Oi, eu sou o Bubbly!",
    text: "Seus horários e avisos já estão prontos. Aqui em Ajustes faltam só duas coisas: vou te mostrar.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-whatsapp",
    title: "Conecte o WhatsApp",
    text: "É por ele que saem a confirmação do agendamento e os avisos às clientes. Toque aqui, ligue e use o código no seu celular.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ajuste-mensagens",
    title: "Edite suas mensagens",
    text: "Escreva a mensagem do agendamento, o 1º e o 2º aviso, e escolha como chamar a cliente. A IA lê as respostas e te avisa quem confirmou.",
    advance: "next",
  },
  {
    path: "/ajustes",
    title: "Agora é com você!",
    text: "O selo amarelo mostra o que ainda falta. O tour fica no fim de Ajustes se quiser rever.",
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
