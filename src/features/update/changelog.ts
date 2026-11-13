/**
 * Novidades do app, em linguagem simples para a profissional. É a única fonte do accordion "O que mudou" em
 * Ajustes e do diálogo "App atualizado" (aparece uma vez por versão, por aparelho).
 *
 * Como usar: ao publicar algo que ela percebe, ponha uma versão nova NO TOPO da lista e suba o número
 * (1.1.0 → 1.2.0 para novidade; 1.1.0 → 1.1.1 só para correção). Texto curto, sem termo técnico.
 */

export type ChangeKind = "new" | "improved" | "fix" | "layout" | "removed";

export type ChangeItem = { kind: ChangeKind; text: string };

export type Release = {
  /** Número da versão; muda o diálogo de "atualizado" para quem já viu a anterior. */
  version: string;
  /** AAAA-MM-DD */
  date: string;
  /** Uma frase: o que essa versão trouxe. */
  title: string;
  items: ChangeItem[];
};

export const CHANGE_LABEL: Record<ChangeKind, string> = {
  new: "Novo",
  improved: "Melhoria",
  fix: "Correção",
  layout: "Visual",
  removed: "Removido",
};

/** Mais recente primeiro. */
export const RELEASES: readonly Release[] = [
  {
    version: "1.5.0",
    date: "2026-11-13",
    title: "Painel novo: seus ganhos do dia ao lado da Bolha",
    items: [
      {
        kind: "new",
        text: "Ao lado da Bolha, um gráfico mostra quanto você já recebeu no dia e quanto falta. Toque no olhinho para esconder os valores, como no app do banco; o aparelho lembra a escolha.",
      },
      {
        kind: "layout",
        text: "A Bolha ficou maior e fala num balão que aparece e some sozinho, trocando as informações do dia. Toque no balão para fechar ou na Bolha para ouvir a próxima.",
      },
      {
        kind: "improved",
        text: "Dá para agendar fora do expediente: o app só avisa que o horário está fora, sem impedir.",
      },
      {
        kind: "removed",
        text: "Os botões Bloquear e Agendar saíram do Painel. Agende pelo + da barra de baixo ou tocando num horário vazio; Bloquear continua no Calendário.",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-11-13",
    title: "A agenda do iPhone dentro do app",
    items: [
      {
        kind: "new",
        text: "Em Ajustes > Conexões, ligue o Calendário do iPhone e cole o link do Calendário Público: o que você já marca no iPhone aparece na agenda do app, em cinza.",
      },
      {
        kind: "new",
        text: "Evento com o nome de uma cliente vira agendamento com um toque em Transformar em agendamento, já com a cliente, o serviço e o horário.",
      },
      {
        kind: "layout",
        text: "Eventos que não são do app (Google ou iPhone) ficam cinza, com o ícone de onde vieram.",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-11-13",
    title: "Agenda no Calendário do iPhone",
    items: [
      {
        kind: "new",
        text: "Em Ajustes > Conexões, o Calendário do iPhone: um link que põe seus agendamentos no app Calendário e atualiza sozinho. Dá para ocultar o nome das clientes.",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-11-12",
    title: "Notificações com ícone e cor",
    items: [
      {
        kind: "layout",
        text: "Cada notificação do sino tem um ícone e uma cor: vermelho quando algo parou, laranja quando pede atenção, verde quando deu certo e azul para a rotina da agenda.",
      },
      {
        kind: "layout",
        text: "Quando a notificação é de uma cliente, aparece a bolinha com as iniciais dela, sempre na mesma cor.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-11-12",
    title: "Notificação mais simples e lembretes mais flexíveis",
    items: [
      { kind: "new", text: "Agora você pode ligar ou desligar o 1º aviso do WhatsApp. Ele já vem ligado." },
      {
        kind: "improved",
        text: "O 2º aviso virou um lembrete: se a cliente já confirmou, a mensagem vai sem as opções 1, 2 e 3. Se ainda não confirmou, as opções continuam.",
      },
      {
        kind: "layout",
        text: "“Avisos no celular” agora se chama Notificação e mostra o que chega no celular e o aviso de teste.",
      },
      {
        kind: "improved",
        text: "O bom dia chega 2 horas antes da primeira cliente, e no fim do expediente vem o resumo de hoje e de amanhã.",
      },
      { kind: "removed", text: "Saiu o bom dia motivacional de horário fixo." },
      { kind: "improved", text: "O WhatsApp não manda mensagem automática das 21h às 6h." },
      { kind: "new", text: "Meu perfil: campo para o telefone comercial." },
      {
        kind: "removed",
        text: "Saiu o cartão “Avisos do dia”: tudo o que ele fazia continua funcionando em Notificação.",
      },
      { kind: "new", text: "Em Atualização do app você vê o que mudou, e o app avisa quando a versão é atualizada." },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-11-11",
    title: "Bom dia às 7h e lista de vagas personalizada",
    items: [
      { kind: "new", text: "Mensagem de bom dia motivacional todo dia às 7h, com interruptor para desligar." },
      {
        kind: "new",
        text: "Vagas: monte uma lista personalizada com período e filtros, e salve para usar de novo.",
      },
      { kind: "improved", text: "Avisos do dia sem o teste de 2 minutos, e o tour na mesma ordem de Ajustes." },
    ],
  },
];

export const CURRENT_VERSION = RELEASES[0].version;
/** localStorage: última versão cujo diálogo "App atualizado" este aparelho já viu. */
export const SEEN_VERSION_KEY = "bubbly:versao-vista";
export const CURRENT_RELEASE = RELEASES[0];

/** "12/11/2026" */
export function releaseDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
