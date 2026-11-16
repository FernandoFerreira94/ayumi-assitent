/** Regras puras do step-up do painel do dono (a parte com banco fica em step-up.ts). */
export const STEP_UP_HOURS = 12;
export const LOCK_WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;

export function isStepUpFresh(verifiedAt: Date | null, now: Date): boolean {
  if (!verifiedAt) return false;
  return now.getTime() - verifiedAt.getTime() < STEP_UP_HOURS * 3_600_000;
}

/** 5 códigos errados em 15 min travam novas tentativas por 15 min, contados do erro mais recente. */
export function stepUpLockedUntil(failures: Date[], now: Date): Date | null {
  const recent = failures
    .filter((f) => now.getTime() - f.getTime() < LOCK_WINDOW_MS)
    .sort((a, b) => b.getTime() - a.getTime());
  if (recent.length < MAX_FAILURES) return null;
  const until = new Date(recent[0].getTime() + LOCK_WINDOW_MS);
  return until > now ? until : null;
}
