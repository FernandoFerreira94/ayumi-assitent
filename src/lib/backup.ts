/** Nome do arquivo de backup: backups/2026/11/assist-2026-11-05T03-00-00Z.sql.gz */
export function backupKey(now: Date): string {
  const iso = now
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/:/g, "-");
  return `backups/${iso.slice(0, 4)}/${iso.slice(5, 7)}/assist-${iso}.sql.gz`;
}

/** Chaves mais velhas que `keepDays` (pela data no nome). Nomes fora do padrão nunca são apagados. */
export function expiredKeys(keys: string[], now: Date, keepDays: number): string[] {
  const limit = now.getTime() - keepDays * 86_400_000;
  return keys.filter((k) => {
    const m = /assist-(\d{4}-\d{2}-\d{2})T/.exec(k);
    return m ? new Date(`${m[1]}T00:00:00Z`).getTime() < limit : false;
  });
}
