/**
 * Passos do tour de primeiro acesso: o básico no Painel e depois a configuração em Ajustes, que é o que faz
 * o Mimo funcionar (WhatsApp, Google, mensagens, IA e horários). `target` é um seletor (pode casar vários
 * elementos: o destaque cobre todos); `path` leva à tela do passo. "tap" só avança quando a pessoa toca no
 * destaque; "next" tem botão.
 */
export type TourStep = {
  target?: string;
  /** Tela onde o passo acontece; sem `path`, fica onde está. */
  path?: "/agenda" | "/ajustes";
  title: string;
  text: string;
  advance: "next" | "tap";
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/agenda",
    title: "Oi, eu sou o Mimo!",
    text: "Vou te mostrar o principal do app e te ajudar a deixar tudo configurado. Leva uns minutinhos.",
    advance: "next",
  },
  {
    path: "/agenda",
    target: "[data-tour='bubble']",
    title: "Seu dia num toque",
    text: "Aqui eu conto como está o dia: quantas clientes, quem falta confirmar. Toque em mim para ver a próxima informação.",
    advance: "tap",
  },
  {
    path: "/agenda",
    target: "[data-tour='money']",
    title: "Agendar e bloquear",
    text: "Daqui você agenda uma cliente ou bloqueia um horário. Na agenda, segure um atendimento para arrastar ou toque num vazio para marcar.",
    advance: "next",
  },
  {
    path: "/agenda",
    target: ".tabbar",
    title: "O menu fica embaixo",
    text: "Painel, Calendário, o + para agendar de qualquer tela, Financeiro e Clientes. O resto fica no menu da sua foto, no canto de cima.",
    advance: "next",
  },
  {
    path: "/agenda",
    target: "[data-tour='bell']",
    title: "Notificações",
    text: "No sino aparece quem confirmou, quem quer cancelar ou remarcar e quem não respondeu. Tocar abre a conversa.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#whatsapp",
    title: "1. Conecte o WhatsApp",
    text: "É pelo WhatsApp do salão que saem a confirmação do agendamento e os avisos. Toque em Conectar e use o código no seu celular.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#google",
    title: "2. Conecte o Google Agenda",
    text: "Seus agendamentos aparecem no Google e os compromissos de lá bloqueiam a agenda do Mimo.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#mensagens",
    title: "3. Monte suas mensagens",
    text: "Escolha como chamar a cliente e escreva a mensagem do agendamento, o 1º aviso e o 2º aviso. Use {valor} para mostrar o preço.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#ia",
    title: "4. Regras para a IA",
    text: "A IA responde aos avisos por você e já vem ligada. Conte aqui o que ela precisa saber, como dias de atendimento e atrasos.",
    advance: "next",
  },
  {
    path: "/ajustes",
    target: "#expediente",
    title: "5. Seus horários",
    text: "Marque os dias e horários em que você atende e a pausa do almoço. As vagas e a agenda seguem esses horários.",
    advance: "next",
  },
  {
    title: "Tudo pronto!",
    text: "Lembre de tocar em Salvar em cada cartão que mudar. Se quiser rever o tour, ele fica no fim de Ajustes.",
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
