/** Logo "Agenda com brilho": calendário arredondado + dois brilhos. */
export function Logo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={className} role="img" aria-label="Assist Agent">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M30 16 H66 A18 18 0 0 1 84 34 V72 A18 18 0 0 1 66 90 H30 A18 18 0 0 1 12 72 V34 A18 18 0 0 1 30 16 Z M44 38 Q46.8 55.2 64 58 Q46.8 60.8 44 78 Q41.2 60.8 24 58 Q41.2 55.2 44 38 Z M70 28 Q71.12 34.88 78 36 Q71.12 37.12 70 44 Q68.88 37.12 62 36 Q68.88 34.88 70 28 Z"
      />
      <path fill="currentColor" d="M28 4 H38 V22 H28 Z M58 4 H68 V22 H58 Z" />
    </svg>
  );
}
