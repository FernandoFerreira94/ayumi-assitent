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
const HAPPY_L = "M185.96 255.83A18 18 0 0 1 218.04 255.83";
const HAPPY_R = "M261.96 255.83A18 18 0 0 1 294.04 255.83";
const SMILE = "M249.7 293.05A12 12 0 0 1 230.3 293.05";

/**
 * shy: tapa os olhos (senha escondida) · peek: espia (senha à mostra) · thinking: olhos de luz,
 * enquanto espera o servidor · worried: erro · wink: piscadinha (reação ao toque no login) ·
 * focused: olha para baixo com a boquinha apertada e uma gotinha de suor (agendando).
 */
export type MascotMood = "neutral" | "happy" | "shy" | "peek" | "thinking" | "worried" | "wink" | "focused";

export function Mascot({
  mood = "neutral",
  size = 48,
  className = "",
  idle = false,
  look,
  children,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Parada na tela: pisca e olha em volta sozinha (animações em globals.css). */
  idle?: boolean;
  /** Desloca o rosto (em unidades do desenho) para a Bolha olhar para algo, como o campo de e-mail. */
  look?: readonly [number, number];
  /** Desenhado por cima do corpo, no mesmo sistema de coordenadas (ex.: a folhinha que ela segura). */
  children?: React.ReactNode;
}) {
  const id = useId();
  const circles = (grow: number) => BODY.map(([cx, cy, r]) => <circle key={cx + cy} cx={cx} cy={cy} r={r + grow} />);
  const openEyes = (
    <g className="mascot-blink" fill={EYE}>
      <ellipse cx="202" cy="254" rx="15" ry="24" />
      <ellipse cx="278" cy="254" rx="15" ry="24" />
      <circle cx="197" cy="246" r="5.5" fill="#fff" />
      <circle cx="273" cy="246" r="5.5" fill="#fff" />
    </g>
  );
  const stroke = { fill: "none", stroke: EYE, strokeLinecap: "round" } as const;
  let face: React.ReactNode;
  switch (mood) {
    case "happy":
      face = <path d={`${HAPPY_L}${HAPPY_R}`} {...stroke} strokeWidth="11" />;
      break;
    case "wink":
      face = (
        <>
          <ellipse cx="202" cy="254" rx="15" ry="24" fill={EYE} />
          <circle cx="197" cy="246" r="5.5" fill="#fff" />
          <path d={HAPPY_R} {...stroke} strokeWidth="11" />
        </>
      );
      break;
    case "shy":
      face = (
        <>
          <path d="M215.37 256.81A15 15 0 0 1 188.63 256.81M291.37 256.81A15 15 0 0 1 264.63 256.81" {...stroke} strokeWidth="8" />
          <g fill="#B9A6FF">
            <ellipse cx="196" cy="262" rx="26" ry="20" transform="rotate(-17 196 262)" />
            <ellipse cx="284" cy="262" rx="26" ry="20" transform="rotate(17 284 262)" />
          </g>
        </>
      );
      break;
    case "peek":
      face = (
        <>
          <path d="M187 262A15 10 0 0 0 217 262ZM263 262A15 10 0 0 0 293 262Z" fill={EYE} />
          <path d="M185 262H219M261 262H295" {...stroke} strokeWidth="6" />
        </>
      );
      break;
    case "thinking":
      face = (
        <g className="mascot-think">
          <ellipse cx="202" cy="254" rx="16" ry="25" fill={`url(#${id}r)`} />
          <ellipse cx="278" cy="254" rx="16" ry="25" fill={`url(#${id}r)`} />
          <ellipse cx="199" cy="247" rx="3.5" ry="7" fill="#fff" opacity="0.85" />
          <ellipse cx="275" cy="247" rx="3.5" ry="7" fill="#fff" opacity="0.85" />
        </g>
      );
      break;
    case "worried":
      face = (
        <>
          {openEyes}
          <path d="M182 222L212 212M298 222L268 212" {...stroke} strokeWidth="6" />
        </>
      );
      break;
    case "focused":
      face = (
        <>
          <g transform="translate(0 9)">{openEyes}</g>
          <path d="M326 165C333.8 174.7 333.2 183.2 326 183.2C318.8 183.2 318.2 174.7 326 165Z" fill="#9CCBFF" className="mascot-drop" />
        </>
      );
      break;
    default:
      face = openEyes;
  }
  // Boca: some quando tapa os olhos ou pensa; vira para baixo no erro; apertada quando concentrada
  const mouth =
    mood === "worried"
      ? "M230.29 298.95A12 12 0 0 1 249.71 298.95"
      : mood === "focused"
        ? "M236 291Q246 294 256 290"
        : mood === "shy" || mood === "thinking"
          ? null
          : SMILE;

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
      <g
        className="mascot-look"
        style={look ? { transform: `translate(${look[0]}px, ${look[1]}px)`, transition: "transform 0.25s ease-out" } : undefined}
      >
        {face}
        {mouth ? <path d={mouth} {...stroke} strokeWidth="6" /> : null}
      </g>
      {children}
    </svg>
  );
}
