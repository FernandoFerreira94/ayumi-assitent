import { DEFAULT_MASCOT, MASCOT_STORAGE, MASCOTS, type MascotKind } from "./mascots";

/** Troca o tema na hora: cores (data-mascot no <html>), cor da barra do sistema e o que fica salvo no aparelho. */
export function applyMascot(kind: MascotKind) {
  const root = document.documentElement;
  if (kind === DEFAULT_MASCOT) delete root.dataset.mascot;
  else root.dataset.mascot = kind;
  const color = MASCOTS.find((m) => m.id === kind)?.primary;
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  try {
    localStorage.setItem(MASCOT_STORAGE, kind);
  } catch {
    // Sem armazenamento (aba privada): o servidor reaplica a cada abertura
  }
}
