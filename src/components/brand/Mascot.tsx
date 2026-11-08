import { useId } from "react";

/*
 * Bolha, o mascote, redesenhada em SVG a partir da prancha (lá é canvas).
 * Provisória: a peça final com todos os humores vem da thread do mascote e substitui este arquivo.
 */
const BODY = [
  [158.4, 274.4, 81.6],
  [321.6, 281.2, 74.8],
  [240, 206.4, 102],
  [240, 308.4, 81.6],
] as const;
const RIM = ["#6D4AFF", "#B9A6FF", "#FF8FB1", "#E5547F", "#8E73FF"];
const EYE = "#3B22B8";

export function Mascot({
  mood = "neutral",
  size = 48,
  className = "",
  idle = false,
}: {
  mood?: "neutral" | "happy";
  size?: number;
  className?: string;
  /** Parada na tela: pisca e olha em volta sozinha (animações em globals.css). */
  idle?: boolean;
}) {
  const id = useId();
  const circles = (grow: number) => BODY.map(([cx, cy, r]) => <circle key={cx + cy} cx={cx} cy={cy} r={r + grow} />);

  return (
    <svg
      viewBox="70 95 340 305"
      width={size}
      height={(size * 305) / 340}
      className={`${idle ? "mascot-idle" : ""} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}b`} cx="0.45" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#FDFCFF" />
          <stop offset="1" stopColor="#E6DEFF" />
        </radialGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          {RIM.map((c, i) => (
            <stop key={c} offset={i / (RIM.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <mask id={`${id}m`}>
          <g fill="#fff">{circles(0)}</g>
          <g fill="#000">{circles(-9)}</g>
        </mask>
        <radialGradient id={`${id}c`}>
          <stop offset="0" stopColor="#FF8FB1" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FF8FB1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill={`url(#${id}r)`}>{circles(0)}</g>
      <g fill={`url(#${id}b)`}>{circles(-9)}</g>
      <rect x="70" y="95" width="340" height="305" fill={`url(#${id}r)`} mask={`url(#${id}m)`} opacity="0.35" />
      <ellipse cx="185" cy="150" rx="34" ry="13" transform="rotate(-34 185 150)" fill="#fff" opacity="0.9" />
      <circle cx="228" cy="138" r="6" fill="#fff" opacity="0.9" />
      <circle cx="172" cy="296" r="24" fill={`url(#${id}c)`} />
      <circle cx="308" cy="296" r="24" fill={`url(#${id}c)`} />
      {/* Rosto em grupos: .mascot-look move o rosto todo, .mascot-blink fecha só os olhos */}
      <g className="mascot-look">
        {mood === "happy" ? (
          <path d="M185.96 255.83A18 18 0 0 1 218.04 255.83M261.96 255.83A18 18 0 0 1 294.04 255.83" fill="none" stroke={EYE} strokeWidth="11" strokeLinecap="round" />
        ) : (
          <g className="mascot-blink" fill={EYE}>
            <ellipse cx="202" cy="254" rx="15" ry="24" />
            <ellipse cx="278" cy="254" rx="15" ry="24" />
            <circle cx="197" cy="246" r="5.5" fill="#fff" />
            <circle cx="273" cy="246" r="5.5" fill="#fff" />
          </g>
        )}
        <path d="M249.7 293.05A12 12 0 0 1 230.3 293.05" fill="none" stroke={EYE} strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
