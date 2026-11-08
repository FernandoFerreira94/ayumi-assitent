"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/agenda",
    label: "Painel",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
        <path d="M8 3v3.5M16 3v3.5M3.5 10h17" />
      </>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </>
    ),
  },
  {
    href: "/vagas",
    label: "Vagas",
    icon: <path d="M12 3.5 13.6 10.4 20.5 12 13.6 13.6 12 20.5 10.4 13.6 3.5 12 10.4 10.4Z" />,
  },
  {
    href: "/ajustes",
    label: "Ajustes",
    icon: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2.5" />
        <circle cx="15" cy="17" r="2.5" />
      </>
    ),
  },
] as const;

export function Dock({ onCreate }: { onCreate?: () => void }) {
  const pathname = usePathname();
  const active = Math.max(
    0,
    TABS.findIndex((t) => pathname === t.href || pathname.startsWith(`${t.href}/`)),
  );
  return (
    <div className="dock">
      <nav className="tabs" aria-label="Navegação" style={{ ["--i" as string]: active }}>
        <span className="ind" aria-hidden="true" />
        {TABS.map((t, i) => (
          <Link key={t.href} href={t.href} className="tab" aria-current={i === active ? "page" : undefined}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {t.icon}
            </svg>
            {t.label}
          </Link>
        ))}
      </nav>
      <button type="button" className="fab" aria-label="Criar" onClick={onCreate}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
