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
