/** Pergunta ao servidor qual a versão atual; null se não deu (offline, erro). */
export async function fetchServerBuild(signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store", signal });
    if (!res.ok) return null;
    const { build } = (await res.json()) as { build?: string };
    return build || null;
  } catch {
    return null;
  }
}

const JUST_UPDATED_KEY = "bubbly:app-atualizado";
/** Versão para a qual esta aba já tentou atualizar (trava contra recarregar em laço). */
export const UPDATING_TO_KEY = "bubbly:atualizando-para";

/** true uma única vez depois de atualizar (para o toast "App atualizado"). */
export function takeJustUpdated(): boolean {
  try {
    if (sessionStorage.getItem(JUST_UPDATED_KEY) !== "1") return false;
    sessionStorage.removeItem(JUST_UPDATED_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Algo aberto ou sendo digitado: não é hora de recarregar. */
export function isBusy(): boolean {
  if (document.querySelector("dialog[open], [role='dialog'], [role='alertdialog'], [data-vaul-drawer]")) return true;
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/**
 * Limpa o service worker e o cache do app e recarrega para pegar a versão nova. Com `to`, abre essa tela em vez
 * de recarregar a atual. Depois de carregar aparece o toast "App atualizado".
 */
export async function applyUpdate(to?: string): Promise<void> {
  try {
    sessionStorage.setItem(JUST_UPDATED_KEY, "1");
  } catch {}
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch {}
  if (to) window.location.replace(to);
  else window.location.reload();
}
