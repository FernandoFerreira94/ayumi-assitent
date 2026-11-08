/** Bloqueia a atualização enquanto a pessoa está no meio de algo (campo em foco, diálogo aberto ou texto digitado). */
export function isBusyEditing(doc: Document, typed: boolean): boolean {
  const el = doc.activeElement;
  if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) {
    const t = (el as HTMLInputElement).type;
    if (!["button", "submit", "checkbox", "radio"].includes(t)) return true;
  }
  if (doc.querySelector('[role="dialog"], [data-vaul-drawer]')) return true;
  return typed;
}

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
