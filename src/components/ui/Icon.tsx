import type { ReactNode } from "react";

/**
 * Conjunto único de ícones do app, no mesmo traço da barra de baixo (24px, linha 2, pontas redondas).
 * Desenho simples que explica a ação sozinho; o texto do lado continua sendo o nome para leitores de tela.
 */
const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.8 2.8L16.2 9.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  reschedule: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
      <path d="M12 8v4l2.5 1.5" />
    </>
  ),
  userX: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M17 9l4 4M21 9l-4 4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.3-2.6M10.5 5.6A15 15 0 0 1 22 9.5" />
      <circle cx="12" cy="20" r="0.9" fill="currentColor" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
      <path d="M9 17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="4" y="7.5" width="16.5" height="12" rx="3" />
      <path d="M16.5 13.5h1.5" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </>
  ),
  forecast: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M12 13v2.5l1.8 1.2" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 8.5a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3a2 2 0 0 0 0-4v-3a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2Z" />
      <path d="M14 5.5v12" strokeDasharray="2 2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
      <path d="M8 3v3.5M16 3v3.5M3.5 10h17" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6.5" r="2.8" />
      <circle cx="6" cy="17.5" r="2.8" />
      <path d="M8.3 8.2L20 18M8.3 15.8L20 6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5Z" />
    </>
  ),
  chat: <path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.6 19Z" />,
  message: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3.5" />
      <path d="M7.5 10h9M7.5 14h5.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 3l1.8 4.7L17.5 9.5l-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8Z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  map: (
    <>
      <path d="M9 4.5l-5 2v13l5-2 6 2 5-2v-13l-5 2Z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  google: (
    <>
      <path d="M20 12.2h-8" />
      <path d="M19.7 10A8 8 0 1 0 20 12.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ""}`}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Cores dos quadradinhos, como nos Ajustes do iPhone: cada assunto tem a sua. */
const TILE = {
  green: "#25B864",
  blue: "#3D7CF2",
  lavender: "#7A5CFF",
  pink: "#E5547F",
  orange: "#F2923D",
  red: "#E5484D",
  teal: "#1FA9B8",
  gray: "#8A84A3",
} as const;

export type Tint = keyof typeof TILE;

/** Quadradinho colorido com o desenho branco dentro (título dos cartões de Ajustes). */
export function IconTile({ name, tint }: { name: IconName; tint: Tint }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-content-center rounded-[9px] text-white shadow-[0_2px_6px_-2px_rgba(23,20,43,0.35)]"
      style={{ background: TILE[tint] }}
    >
      <Icon name={name} size={18} />
    </span>
  );
}

/** Título de cartão com quadradinho: o desenho diz do que se trata antes de ler. */
export function TileTitle({
  icon,
  tint,
  as: Tag = "p",
  children,
}: {
  icon: IconName;
  tint: Tint;
  as?: "p" | "h2";
  children: ReactNode;
}) {
  return (
    <Tag className="flex items-center gap-2.5 font-bold">
      <IconTile name={icon} tint={tint} />
      <span className="min-w-0">{children}</span>
    </Tag>
  );
}
