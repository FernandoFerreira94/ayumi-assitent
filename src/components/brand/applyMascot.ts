import { DEFAULT_MASCOT, MASCOT_COOKIE, MASCOT_STORAGE, MASCOTS, type MascotKind } from "./mascots";

/**
 * Ícone da tela de início e tela de abertura do iPhone do mascote. O iOS guarda os dois na hora de
 * "Adicionar à Tela de Início": quem troca de mascote com o app já instalado precisa adicionar de novo.
 */
function swapHomeScreenAssets(kind: MascotKind) {
  document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-icon"]').forEach((link) => {
    const bolha = (link.dataset.bolha ??= link.getAttribute("href") ?? "");
    link.href = kind === DEFAULT_MASCOT ? bolha : `/icons/${kind}/apple-180.png`;
  });
  document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-startup-image"]').forEach((link) => {
    const bolha = (link.dataset.bolha ??= link.getAttribute("href") ?? "");
    const size = bolha.match(/(\d+x\d+)\.png/)?.[1];
    if (size) link.href = kind === DEFAULT_MASCOT ? bolha : `/icons/${kind}/splash-${size}.png`;
  });
}

/** Troca o tema na hora: cores (data-mascot no <html>), cor da barra do sistema, ícone e o que fica salvo no aparelho. */
export function applyMascot(kind: MascotKind, persist = true) {
  const root = document.documentElement;
  if (kind === DEFAULT_MASCOT) delete root.dataset.mascot;
  else root.dataset.mascot = kind;
  const color = MASCOTS.find((m) => m.id === kind)?.primary;
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  if (!persist) return;
  swapHomeScreenAssets(kind);
  document.cookie = `${MASCOT_COOKIE}=${kind}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(MASCOT_STORAGE, kind);
  } catch {
    // Sem armazenamento (aba privada): o servidor reaplica a cada abertura
  }
}
