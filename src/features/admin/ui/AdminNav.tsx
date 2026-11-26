"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SideNavBrand } from "@/components/nav/SideNavBrand";
import { SideNavSignOut } from "@/components/nav/SideNavSignOut";
import { useNavIndicator } from "@/components/nav/useNavIndicator";

type Item = { href: string; label: string; icon: IconName };

/** Itens do painel do dono. */
export const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Visão geral", icon: "compass" },
  { href: "/admin/assinantes", label: "Assinantes", icon: "users" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: "wallet" },
  { href: "/admin/uso", label: "Uso", icon: "forecast" },
  { href: "/admin/suporte", label: "Suporte", icon: "chat" },
  { href: "/admin/avisos", label: "Avisos", icon: "bell" },
  { href: "/admin/respostas", label: "Respostas", icon: "message" },
  { href: "/admin/seguranca", label: "Segurança", icon: "shield" },
];

const isOn = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

/**
 * Menu do painel do dono, no mesmo visual do menu lateral do app (trilho de ícones de 768 px, nomes a partir de
 * 1280 px). No celular vira uma faixa de abas no topo. Só aparece depois do requireAdmin (fica dentro da página).
 */
export function AdminNav({ supportUnread = 0 }: { supportUnread?: number }) {
  const pathname = usePathname();
  const navRef = useNavIndicator<HTMLElement>(pathname);
  const badge = (href: string) =>
    href === "/admin/suporte" && supportUnread > 0 ? (
      <span className="rounded-full bg-primary px-1.5 text-xs font-bold leading-5 text-white">
        {supportUnread}
        <span className="sr-only"> sem resposta</span>
      </span>
    ) : null;
  return (
    <>
      <nav ref={navRef} aria-label="Painel do dono" className="sidenav">
        <span aria-hidden="true" className="sidenav-indicator" />
        <SideNavBrand href="/admin" label="Bubbly Admin, início" subtitle="Painel do dono" />
        <ul className="sidenav-list">
          {ADMIN_NAV.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                title={i.label}
                aria-current={isOn(pathname, i.href) ? "page" : undefined}
                className="sidenav-link"
              >
                <span className="relative">
                  <Icon name={i.icon} size={22} />
                  {supportUnread > 0 && i.href === "/admin/suporte" ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 size-2.5 rounded-full bg-primary xl:hidden"
                    />
                  ) : null}
                </span>
                <span className="sr-only xl:not-sr-only xl:flex-1">{i.label}</span>
                <span className="hidden xl:inline">{badge(i.href)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/agenda" className="sidenav-link sidenav-profile" title="Voltar ao Painel">
          <Icon name="arrowLeft" size={22} />
          <span className="sr-only xl:not-sr-only xl:flex-1">Voltar ao Painel</span>
        </Link>
        <SideNavSignOut />
      </nav>
      <nav
        aria-label="Painel do dono"
        className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 pb-2 pt-[max(env(safe-area-inset-top),8px)] md:hidden"
      >
        {/* No celular não há menu lateral: esta é a única saída do /admin de volta ao app. */}
        <Link
          href="/agenda"
          aria-label="Voltar ao Painel"
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-primary-text"
        >
          <Icon name="arrowLeft" size={18} />
          Painel
        </Link>
        {ADMIN_NAV.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isOn(pathname, i.href) ? "page" : undefined}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-muted aria-[current=page]:bg-soft aria-[current=page]:text-primary-text"
          >
            <Icon name={i.icon} size={18} />
            {i.label}
            {badge(i.href)}
          </Link>
        ))}
      </nav>
    </>
  );
}
