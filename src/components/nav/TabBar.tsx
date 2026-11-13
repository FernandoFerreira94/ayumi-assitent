"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { isNavActive } from "./nav-items";

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
  {
    href: "/financeiro",
    label: "Financeiro",
    // Nome curto que aparece na aba atual (cabe na lente em telas estreitas)
    short: "Finanças",
    icon: (on: boolean) =>
      on ? (
        svg(
          <>
            <circle cx="12" cy="12" r="9" fill="currentColor" />
            <path d="M12 3v9h9" stroke="#fff" />
          </>,
        )
      ) : (
        svg(
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v9h9" />
          </>,
        )
      ),
  },
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

/**
 * Barra de vidro flutuante no estilo do iOS 26: pílula translúcida com as abas e uma lente lavanda que
 * desliza com mola até a aba atual, que mostra o nome embaixo do ícone; o + fica num botão redondo à parte (é ação, não aba).
 * O menu lateral continua no avatar do topo. Tocar de novo na aba atual sobe ao topo.
 */
export function TabBar() {
  const pathname = usePathname();
  const pill = useRef<HTMLDivElement>(null);

  // Mede a aba atual e move a lente até ela (só transform/width, sem reflow da barra)
  useLayoutEffect(() => {
    const el = pill.current;
    if (!el) return;
    const place = () => {
      const cur = el.querySelector<HTMLElement>('[aria-current="page"]');
      if (!cur) {
        el.dataset.lens = "off";
        return;
      }
      const a = el.getBoundingClientRect();
      const b = cur.getBoundingClientRect();
      el.style.setProperty("--lens-x", `${b.left - a.left}px`);
      el.style.setProperty("--lens-w", `${b.width}px`);
      // Primeira medida entra sem animar; as seguintes deslizam
      el.dataset.lens = el.dataset.lens ? "on" : "init";
      if (el.dataset.lens === "init") requestAnimationFrame(() => (el.dataset.lens = "on"));
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [pathname]);

  return (
    <nav className="tabbar" aria-label="Navegação">
      <div ref={pill} className="tab-pill">
        <span className="tab-lens" aria-hidden="true" />
        <ul>
          {TABS.map((t) => {
            const on = isNavActive(pathname, t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-label={t.label}
                  aria-current={on ? "page" : undefined}
                  className="tab-link"
                  onClick={(e) => {
                    if (!on) return;
                    // Já está aqui: o toque sobe a tela até o topo
                    e.preventDefault();
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                  }}
                >
                  {/* key muda ao ativar: o ícone remonta e a animação de "pop" roda de novo */}
                  <span key={on ? "on" : "off"} className="tab-icon">
                    {t.icon(on)}
                  </span>
                  {on && (
                    <span className="tab-label" aria-hidden="true">
                      {"short" in t ? t.short : t.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <button type="button" className="tab-act" aria-label="Novo agendamento" onClick={() => openNewAppointment()}>
        {svg(<path d="M12 5v14M5 12h14" />)}
      </button>
    </nav>
  );
}
