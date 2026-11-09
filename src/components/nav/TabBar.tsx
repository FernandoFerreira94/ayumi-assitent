"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openNewAppointment } from "@/features/appointments/QuickBook";

const svg = (d: React.ReactNode, filled = false) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
);

/** Cada aba tem o desenho vazado e o preenchido (aba atual), como nas barras de app do iPhone. */
const TABS = [
  {
    href: "/agenda",
    label: "Painel",
    icon: (on: boolean) =>
      svg(
        <>
          <rect x="3" y="3" width="8" height="8" rx="2.5" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="11" width="8" height="10" rx="2.5" />
          <rect x="3" y="14" width="8" height="7" rx="2" />
        </>,
        on,
      ),
  },
  {
    href: "/calendario",
    label: "Calendário",
    icon: (on: boolean) =>
      on ? (
        svg(
          <>
            <rect x="3" y="5" width="18" height="16" rx="3" fill="currentColor" />
            <path d="M8 3v4M16 3v4" />
            <path d="M3 10h18" stroke="#fff" />
          </>,
        )
      ) : (
        svg(
          <>
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </>,
        )
      ),
  },
  null,
  {
    href: "/clientes",
    label: "Clientes",
    icon: (on: boolean) =>
      svg(
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0Z" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" fill="none" />
        </>,
        on,
      ),
  },
] as const;

const isAt = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Barra de abas fixa embaixo: ícones sem texto, a aba atual preenchida com um "pop" curto, o + no meio
 * agenda de qualquer tela e o avatar (menu com o resto) fica na ponta. Tocar de novo na aba atual sobe ao topo.
 */
export function TabBar({ avatar }: { avatar: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Navegação">
      <ul>
        {TABS.map((t) => {
          if (t === null)
            return (
              <li key="novo">
                <button type="button" className="tab-link" aria-label="Novo agendamento" onClick={() => openNewAppointment()}>
                  {svg(
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="5.5" />
                      <path d="M12 8v8M8 12h8" />
                    </>,
                  )}
                </button>
              </li>
            );
          const on = isAt(pathname, t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-label={t.label}
                aria-current={on ? "page" : undefined}
                className="tab-link"
                onClick={(e) => {
                  if (!on) return;
                  // Já está aqui: como no Instagram, o toque sobe a tela até o topo
                  e.preventDefault();
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                }}
              >
                {/* key muda ao ativar: o ícone remonta e a animação de "pop" roda de novo */}
                <span key={on ? "on" : "off"} className="tab-icon">
                  {t.icon(on)}
                </span>
              </Link>
            </li>
          );
        })}
        <li>{avatar}</li>
      </ul>
    </nav>
  );
}
