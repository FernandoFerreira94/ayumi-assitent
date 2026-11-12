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
      { kind: "removed", text: "Saiu o cartão “Avisos do dia”: tudo o que ele fazia continua funcionando em Notificação." },
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
