import { useId, type ReactNode } from "react";

/**
 * Peças das ilustrações do passo a passo (SVG inline, sem rede e sem peso no PWA).
 * Sempre mockup desenhado, nunca print real: nada de dado de pessoa.
 * Cores pelos tokens (--primary segue o tema do mascote). Área padrão: viewBox 320 × 190.
 */

export const ART_W = 320;
export const ART_H = 190;

export function Art({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      className="block h-auto w-full"
      fill="none"
      fontFamily="inherit"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Celular em pé. As coordenadas dos filhos são da tela (0,0 no canto de cima da tela).
 * Use y negativo para mostrar só a parte de baixo (o resto sai da área e é cortado).
 */
export function Phone({
  x,
  y,
  w = 170,
  h = 300,
  screen = "#ffffff",
  android = false,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  screen?: string;
  /** Android: câmera em furo (bolinha) em vez da ilha do iPhone. */
  android?: boolean;
  children: ReactNode;
}) {
  const clip = useId();
  const sw = w - 10;
  const sh = h - 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={w} height={h} rx={28} fill="#ffffff" stroke="var(--line)" strokeWidth={2} />
      <defs>
        <clipPath id={clip}>
          <rect x={0} y={0} width={sw} height={sh} rx={23} />
        </clipPath>
      </defs>
      <g transform="translate(5 5)" clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={sw} height={sh} fill={screen} />
        {children}
        {android ? (
          <circle cx={sw / 2} cy={13} r={5} fill="#17142b" />
        ) : (
          <rect x={sw / 2 - 22} y={8} width={44} height={12} rx={6} fill="#17142b" />
        )}
      </g>
    </g>
  );
}

/** Destaque do alvo: anel roxo + halo que pulsa (parado com movimento reduzido). */
export function Ring({ x, y, w, h, r }: { x: number; y: number; w: number; h: number; r?: number }) {
  const rx = r ?? Math.min(w, h) / 2;
  return (
    <g>
      <rect
        className="guide-pulse"
        x={x - 3}
        y={y - 3}
        width={w + 6}
        height={h + 6}
        rx={rx + 3}
        stroke="var(--primary)"
        strokeWidth={4}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill="color-mix(in srgb, var(--primary) 10%, transparent)"
        stroke="var(--primary)"
        strokeWidth={2.5}
      />
    </g>
  );
}

/** Balão de legenda (uma ou duas linhas), fora do celular, em letra legível. */
export function Callout({ x, y, lines, w }: { x: number; y: number; lines: string[]; w: number }) {
  const h = 14 + lines.length * 15;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill="#ffffff"
        stroke="color-mix(in srgb, var(--primary) 45%, white)"
        strokeWidth={1.5}
      />
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + 21 + i * 15}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          fill="var(--primary-text)"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/** Seta curva de (x1,y1) até (x2,y2), com ponta. `bend` empurra a curva para o lado. */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  bend = 20,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bend?: number;
}) {
  const head = useId();
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return (
    <g>
      <defs>
        <marker
          id={head}
          viewBox="0 0 10 10"
          refX={7}
          refY={5}
          markerWidth={7}
          markerHeight={7}
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--primary)" />
        </marker>
      </defs>
      <path
        d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`}
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="1 6"
        markerEnd={`url(#${head})`}
      />
    </g>
  );
}

/** Linha de texto “borrada” (só a forma), para lista e conversas sem conteúdo real. */
export function Bar({
  x,
  y,
  w,
  h = 7,
  fill = "#e9e6f4",
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  fill?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />;
}

/** Texto de tela (pequeno, decorativo: a legenda e o texto do passo dizem o mesmo). */
export function T({
  x,
  y,
  children,
  size = 10,
  weight = 700,
  fill = "#17142b",
  anchor = "start",
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}>
      {children}
    </text>
  );
}

/** Número do toque (1, 2) quando a ilustração tem dois alvos. */
export function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="var(--primary)" />
      <text x={x} y={y + 4} fontSize={11} fontWeight={700} fill="#ffffff" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

/** Interruptor estilo iOS (ligado = verde). */
export function Toggle({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={30} height={18} rx={9} fill={on ? "#34c759" : "#e5e5ea"} />
      <circle cx={on ? x + 21 : x + 9} cy={y + 9} r={7.5} fill="#ffffff" />
    </g>
  );
}
