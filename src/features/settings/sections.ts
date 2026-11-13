import type { IconName, Tint } from "@/components/ui/Icon";

/**
 * Seções de Ajustes. A lista (`/ajustes`) mostra uma linha por seção, como os Ajustes do iPhone; cada linha
 * abre a sua tela, que carrega só o que precisa. Ações continuam em sheet/diálogo dentro da seção.
 */
export const SECTIONS = {
  whatsapp: { href: "/ajustes/whatsapp", title: "WhatsApp", icon: "chat", tint: "green" },
  calendarios: { href: "/ajustes/calendarios", title: "Calendários", icon: "calendar", tint: "blue" },
  notificacoes: { href: "/ajustes/notificacoes", title: "Notificações", icon: "bell", tint: "red" },
  mensagens: { href: "/ajustes/mensagens", title: "Mensagens para a cliente", icon: "message", tint: "lavender" },
  expediente: { href: "/ajustes/expediente", title: "Expediente", icon: "clock", tint: "orange" },
} as const satisfies Record<string, { href: string; title: string; icon: IconName; tint: Tint }>;

export type SectionKey = keyof typeof SECTIONS;

/** Âncoras da página única antiga (`/ajustes#google`) → tela nova. Mantém links salvos e avisos antigos. */
const LEGACY_HASH: Record<string, string> = {
  whatsapp: `${SECTIONS.whatsapp.href}#whatsapp`,
  google: `${SECTIONS.calendarios.href}#google`,
  iphone: `${SECTIONS.calendarios.href}#iphone`,
  "avisos-celular": `${SECTIONS.notificacoes.href}#avisos-celular`,
  localizacao: `${SECTIONS.notificacoes.href}#localizacao`,
  mensagens: `${SECTIONS.mensagens.href}#mensagens`,
  ia: `${SECTIONS.mensagens.href}#ia`,
  expediente: `${SECTIONS.expediente.href}#expediente`,
};

/** Destino de `/ajustes#<ancora>` (com ou sem "#"); null quando a âncora não é de uma seção. */
export function legacyTarget(hash: string): string | null {
  const key = hash.replace(/^#/, "");
  return Object.hasOwn(LEGACY_HASH, key) ? LEGACY_HASH[key]! : null;
}

const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Resumo do expediente para a linha de Ajustes: "Seg a Sex", "Seg, Qua e Sex" ou "Fechado a semana toda". */
export function hoursSummary(week: ReadonlyArray<unknown>): string {
  const open = week.map((d, i) => (d ? i : -1)).filter((i) => i >= 0);
  if (open.length === 0) return "Fechado a semana toda";
  if (open.length === 7) return "Todos os dias";
  // Sequência sem buraco (Seg..Sex): mostra o intervalo
  const run = open.every((d, i) => i === 0 || d === open[i - 1]! + 1);
  if (run && open.length >= 3) return `${DAY_SHORT[open[0]!]} a ${DAY_SHORT[open[open.length - 1]!]}`;
  const names = open.map((d) => DAY_SHORT[d]!);
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}
