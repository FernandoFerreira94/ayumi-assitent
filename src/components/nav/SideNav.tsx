// src/components/nav/SideNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { NAV_ICONS } from "./nav-icons";
import { NAV_ITEMS, isNavActive, type NavIconKey, type NavItem } from "./nav-items";

function NavIcon({ name }: { name: NavIconKey }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="sidenav-icon"
    >
      {NAV_ICONS[name]}
    </svg>
  );
}

/**
 * Navegação do tablet e do desktop. De 768 a 1279 px é um trilho de ícones (76 px; o nome fica no title e no leitor
 * de tela); a partir de 1280 px mostra os nomes (248 px). No celular fica escondida: quem navega é a barra do rodapé.
 */
export function SideNav({ studioName, pendencias }: { studioName: string | null; pendencias: number }) {
  const pathname = usePathname();
  const salon = studioName ?? "Meu salão";

  const link = (item: NavItem) => {
    const on = isNavActive(pathname, item.href);
    const count = item.href === "/pendencias" && pendencias > 0 ? pendencias : null;
    return (
      <li key={item.href}>
        <Link href={item.href} title={item.label} aria-current={on ? "page" : undefined} className="sidenav-link">
          <NavIcon name={item.icon} />
          <span className="sr-only xl:not-sr-only xl:flex-1">{item.label}</span>
          {count ? (
            <>
              {" "}
              <span className="sidenav-count">{count}</span>
            </>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Navegação principal" data-tour="sidenav" className="sidenav">
      <p className="sidenav-brand">
        <span aria-hidden="true" className="sidenav-dot" />
        <span className="sr-only xl:not-sr-only">Bubbly</span>
      </p>
      <button type="button" className="sidenav-new" title="Novo agendamento (N)" onClick={() => openNewAppointment()}>
        <NavIcon name="novo" />
        <span className="sr-only xl:not-sr-only xl:flex-1 xl:text-left">Novo agendamento</span>
        <kbd aria-hidden="true" className="sidenav-kbd">
          N
        </kbd>
      </button>
      <ul className="sidenav-list">{NAV_ITEMS.filter((i) => i.group === "main").map(link)}</ul>
      <hr className="sidenav-sep" />
      <ul className="sidenav-list">{NAV_ITEMS.filter((i) => i.group === "more").map(link)}</ul>
      <Link
        href="/perfil"
        title="Perfil e conta"
        aria-current={isNavActive(pathname, "/perfil") ? "page" : undefined}
        className="sidenav-link sidenav-profile"
      >
        <span aria-hidden="true" className="sidenav-avatar">
          {salon.charAt(0).toUpperCase()}
        </span>
        <span className="sr-only xl:not-sr-only xl:grid xl:min-w-0 xl:leading-tight">
          <span className="truncate font-bold">{salon}</span>
          {" "}
          <span className="text-xs text-muted">Perfil e conta</span>
        </span>
      </Link>
    </nav>
  );
}
