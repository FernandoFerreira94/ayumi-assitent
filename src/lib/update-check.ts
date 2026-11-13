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

/**
 * Limpa o service worker e o cache do app e recarrega para pegar a versão nova. Com `to`, abre essa tela em vez
 * de recarregar a atual (o botão de Ajustes leva ao Painel, onde aparece o que mudou).
 */
export async function applyUpdate(to?: string): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch {}
  if (to) window.location.replace(to);
  else window.location.reload();
}
