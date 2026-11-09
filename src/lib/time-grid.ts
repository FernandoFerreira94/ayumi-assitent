const pad = (n: number) => String(n).padStart(2, "0");

/** Minutos do dia em HH:MM. */
export const toHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/**
 * Horários para os seletores de hora (agendar, editar, bloquear): de `from` a `to` (minutos do dia),
 * de `step` em `step`. O mesmo passo do arraste na agenda (15 min), para nenhum horário "sumir" ao editar.
 * `include` entra mesmo fora da grade (ex.: um horário antigo de 09:10), para o campo nunca mudar sozinho.
 */
export function timeOptions({
  from = 6 * 60,
  to = 22 * 60,
  step = 15,
  include,
}: { from?: number; to?: number; step?: number; include?: string } = {}): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m += step) out.push(toHHMM(m));
  if (include && /^([01]\d|2[0-3]):[0-5]\d$/.test(include) && !out.includes(include)) {
    out.push(include);
    out.sort();
  }
  return out;
}
