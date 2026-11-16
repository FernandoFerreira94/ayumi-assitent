"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

type Item = { href: string; label: string; icon: IconName };

/** Itens do painel do dono. */
export const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Visão geral", icon: "compass" },
  { href: "/admin/assinantes", label: "Assinantes", icon: "users" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: "wallet" },
  { href: "/admin/seguranca", label: "Segurança", icon: "shield" },
];

const isOn = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

/**
 * Menu do painel do dono, no mesmo visual do menu lateral do app (trilho de ícones de 768 px, nomes a partir de
 * 1280 px). No celular vira uma faixa de abas no topo. Só aparece depois do requireAdmin (fica dentro da página).
 */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Painel do dono" className="sidenav">
        <p className="sidenav-brand">
          <span aria-hidden="true" className="sidenav-dot" />
          <span className="sr-only xl:not-sr-only">Bubbly Admin</span>
        </p>
        <ul className="sidenav-list">
          {ADMIN_NAV.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                title={i.label}
                aria-current={isOn(pathname, i.href) ? "page" : undefined}
                className="sidenav-link"
              >
                <Icon name={i.icon} size={22} />
                <span className="sr-only xl:not-sr-only xl:flex-1">{i.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/agenda" className="sidenav-link sidenav-profile" title="Voltar para o app">
          <Icon name="calendar" size={22} />
          <span className="sr-only xl:not-sr-only xl:flex-1">Voltar para o app</span>
        </Link>
      </nav>
      <nav
        aria-label="Painel do dono"
        className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 pb-2 pt-[max(env(safe-area-inset-top),8px)] md:hidden"
      >
        {ADMIN_NAV.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isOn(pathname, i.href) ? "page" : undefined}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-muted aria-[current=page]:bg-soft aria-[current=page]:text-primary-text"
          >
            <Icon name={i.icon} size={18} />
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
