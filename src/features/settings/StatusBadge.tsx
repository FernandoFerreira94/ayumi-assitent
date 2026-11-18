import type { Badge } from "./connection-status";

const TONE = {
  ok: { pill: "bg-ok-bg text-ok", dot: "bg-ok" },
  warn: { pill: "bg-wait-bg text-wait", dot: "bg-wait" },
  off: { pill: "bg-soft text-muted", dot: "bg-muted/70" },
} as const;

/** Selo de estado: ponto colorido + palavra curta. A cor nunca vem sozinha (a palavra diz o estado). */
export function StatusBadge({ badge, compact = false }: { badge: Badge; compact?: boolean }) {
  const t = TONE[badge.tone];
  return (
    <span
      data-tone={badge.tone}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold ${t.pill} ${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${t.dot}`} />
      {badge.label}
    </span>
  );
}
