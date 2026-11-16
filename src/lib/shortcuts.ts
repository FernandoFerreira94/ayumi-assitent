// src/lib/shortcuts.ts
export type Shortcut =
  | "novo"
  | "buscar"
  | "hoje"
  | "anterior"
  | "proximo"
  | "proxima"
  | "anterior-item"
  | "dia"
  | "semana"
  | "mes";

type KeyInfo = { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; target: EventTarget | null };

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Tecla → atalho. Nada acontece com Ctrl/Cmd/Alt (atalhos do navegador) nem enquanto a pessoa digita. */
export function shortcutFor(e: KeyInfo): Shortcut | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const el = e.target instanceof HTMLElement ? e.target : null;
  if (el && (TYPING.has(el.tagName) || el.isContentEditable)) return null;
  switch (e.key) {
    case "n":
    case "N":
      return "novo";
    case "/":
      return "buscar";
    case "t":
    case "T":
      return "hoje";
    // j/k andam pela lista (Clientes); não usam ← → para não brigar com a troca de dia
    case "j":
    case "J":
      return "proxima";
    case "k":
    case "K":
      return "anterior-item";
    // Visões do Calendário (só valem lá)
    case "d":
    case "D":
      return "dia";
    case "s":
    case "S":
      return "semana";
    case "m":
    case "M":
      return "mes";
    case "ArrowLeft":
      return "anterior";
    case "ArrowRight":
      return "proximo";
    default:
      return null;
  }
}

/** Dia vizinho no formato AAAA-MM-DD (o mesmo do ?d= do Painel), em UTC para não sofrer com horário de verão. */
export function shiftDay(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}
