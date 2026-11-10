"use client";

import { useId, useSyncExternalStore } from "react";
import { todayStr } from "@/lib/dates";
import { seasonOn, type Season } from "./season";
import { seasonLayers } from "./SeasonAccessory";

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

/** Roupa do clima da prancha "Humores do Mimo", por cima de qualquer humor. */
export type MascotWeather = "rain" | "cold" | "hot" | "sun";

const noop = () => () => {};

const drop = (x: number, y: number, s = 1) =>
  `M${x} ${y - 14 * s}Q${x + 11 * s} ${y + 2 * s} ${x} ${y + 8 * s}Q${x - 11 * s} ${y + 2 * s} ${x} ${y - 14 * s}Z`;

const OUTFIT: Record<MascotWeather, React.ReactNode> = {
  rain: (
    <>
      <path
        d="M118 112l-4 14M146 84l-4 14M92 168l-4 14M386 196l-4 14M402 150l-4 14"
        stroke="#9C8FD6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="translate(312 122) rotate(10) scale(0.56)">
        <path d="M0 -10V150Q0 175 -22 170" fill="none" stroke="#17142B" strokeWidth="14" strokeLinecap="round" />
        <path d="M-150 0Q0 -150 150 0Q113 -22 75 0Q38 -22 0 0Q-37 -22 -75 0Q-112 -22 -150 0Z" fill="#6D4AFF" />
        <path d="M0 -94Q0 -80 14 -80Q0 -80 0 -66Q0 -80 -14 -80Q0 -80 0 -94Z" fill="#FF8FB1" />
      </g>
    </>
  ),
  cold: (
    <>
      <path d="M158 128A82 52 0 0 1 322 128Z" fill="#FF8FB1" />
      <rect x="156" y="118" width="168" height="24" rx="6" fill="#E5547F" />
      <path
        d="M166 121v18M180 121v18M194 121v18M208 121v18M222 121v18M236 121v18M250 121v18M264 121v18M278 121v18M292 121v18M306 121v18"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <circle cx="240" cy="84" r="14" fill="#fff" />
      <path d="M150 320Q240 350 330 320L334 348Q240 380 146 348Z" fill="#E5547F" />
      <path d="M290 340H318L326 398H296Z" fill="#FF8FB1" />
    </>
  ),
  hot: (
    <>
      <path d={drop(330, 200, 1.3)} fill="#D6EAFF" stroke="#8E73FF" strokeWidth="2" className="mascot-drop" />
      <path d={drop(150, 228)} fill="#D6EAFF" stroke="#8E73FF" strokeWidth="2" />
      <path d="M226 292A14 14 0 0 0 254 292Z" fill={EYE} />
      <ellipse cx="240" cy="302" rx="9" ry="10" fill="#FF8FB1" />
    </>
  ),
  // Os óculos usam o degradê <id>o, definido em <defs> no componente
  sun: <path d="M230 246Q240 238 250 246" fill="none" stroke="#17142B" strokeWidth="6" strokeLinecap="round" />,
};

// Sol atrás da Bolha: desenhado antes do corpo
const SUN = (
  <g stroke="#FFD08A" strokeWidth="5" strokeLinecap="round">
    <circle cx="372" cy="112" r="20" fill="#FFD08A" stroke="none" />
    <path d="M372 80v-8M372 144v8M340 112h-8M404 112h8M349 89l-6-6M395 135l6 6M395 89l6-6" />
  </g>
);

export function Mascot({
  mood = "neutral",
  size = 48,
  className = "",
  idle = false,
  look,
  weather: weatherProp,
  season: seasonProp,
  children,
}: {
  mood?: MascotMood;
  /** Roupa do clima de hoje; sem ela o desenho fica como sempre. */
  weather?: MascotWeather;
  /**
   * Acessório de data comemorativa. Sem a prop, vem sozinho pela data de hoje (só a partir de 48 px,
   * menor que isso o enfeite vira ruído, como no ícone do toast); null desliga.
   */
  season?: Season | null;
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
  // A data de hoje só é lida no aparelho: páginas geradas no build não ficam presas na data do build
  const today = useSyncExternalStore(noop, todayStr, () => null);
  const season = seasonProp !== undefined ? seasonProp : size >= 48 && today ? seasonOn(today) : null;
  // A data ganha da roupa do clima
  const weather = season ? undefined : weatherProp;
  const extra = season ? seasonLayers(season, id) : null;
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
          <path
            d="M215.37 256.81A15 15 0 0 1 188.63 256.81M291.37 256.81A15 15 0 0 1 264.63 256.81"
            {...stroke}
            strokeWidth="8"
          />
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
          <path
            d="M326 165C333.8 174.7 333.2 183.2 326 183.2C318.8 183.2 318.2 174.7 326 165Z"
            fill="#9CCBFF"
            className="mascot-drop"
          />
        </>
      );
      break;
    default:
      face = openEyes;
  }
  // Boca: some quando tapa os olhos ou pensa; vira para baixo no erro; apertada quando concentrada
  const mouth =
    weather === "hot"
      ? null // a língua de fora vem na roupa do calor
      : mood === "worried"
        ? "M230.29 298.95A12 12 0 0 1 249.71 298.95"
        : mood === "focused"
          ? "M236 291Q246 294 256 290"
          : mood === "shy" || mood === "thinking"
            ? null
            : SMILE;

  // Gorro, pompom e guarda-chuva passam do topo da cabeça: com roupa, o quadro ganha altura.
  // Os acessórios de data vão mais longe (chapéu, balão, confete): quadro maior dos lados também.
  const [left, top, w] = season ? [40, 10, 400] : [70, weather ? 60 : 95, 340];
  const h = 410 - top - (season ? 0 : 10);

  return (
    <svg
      viewBox={`${left} ${top} ${w} ${h}`}
      width={size}
      height={(size * h) / w}
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
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#17142B" />
          <stop offset="0.5" stopColor="#3B22B8" />
          <stop offset="1" stopColor="#17142B" />
        </linearGradient>
      </defs>
      {weather === "sun" ? SUN : null}
      {extra?.back}
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
        style={
          look
            ? { transform: `translate(${look[0]}px, ${look[1]}px)`, transition: "transform 0.25s ease-out" }
            : undefined
        }
      >
        {face}
        {mouth ? <path d={mouth} {...stroke} strokeWidth="6" /> : null}
        {weather === "sun" ? (
          <g fill={`url(#${id}o)`}>
            <rect x="166" y="232" width="66" height="46" rx="16" />
            <rect x="248" y="232" width="66" height="46" rx="16" />
          </g>
        ) : null}
        {extra?.face}
      </g>
      {weather ? OUTFIT[weather] : null}
      {extra?.front}
      {children}
    </svg>
  );
}
