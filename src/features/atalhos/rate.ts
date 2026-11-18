/**
 * Limite em memória (janela fixa). O web roda numa instância só no Railway: zera a cada deploy e, se escalar,
 * cada instância conta separado (só afrouxa). Quando houver mais de uma instância, mover para o Postgres.
 */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function allow(key: string, now = Date.now()): boolean {
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    const cur = hits.get(key);
    if (!cur || cur.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    cur.count += 1;
    return cur.count <= max;
  };
}

const MIN = 60_000;
/** Por IP, antes do banco: freia quem tenta chaves (60/min). */
export const allowIp = createLimiter(60, MIN);
/** Por chave: 30 consultas por minuto e 500 por dia. */
const perMinute = createLimiter(30, MIN);
const perDay = createLimiter(500, 24 * 60 * MIN);
export const allowToken = (tokenId: string, now = Date.now()) => perMinute(tokenId, now) && perDay(tokenId, now);
