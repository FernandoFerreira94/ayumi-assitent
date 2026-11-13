import type { NAV_ICONS } from "./nav-icons";

export type NavIconKey = keyof typeof NAV_ICONS;
export type NavItem = { href: string; label: string; icon: NavIconKey; group: "main" | "more" };

/** Telas do menu lateral e do trilho, na ordem das pranchas: as 4 do dia a dia, separador, as outras 4. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/agenda", label: "Painel", icon: "painel", group: "main" },
  { href: "/calendario", label: "Calendário", icon: "calendario", group: "main" },
  { href: "/financeiro", label: "Finanças", icon: "financeiro", group: "main" },
  { href: "/clientes", label: "Clientes", icon: "clientes", group: "main" },
  { href: "/servicos", label: "Serviços", icon: "servicos", group: "more" },
  { href: "/vagas", label: "Vagas", icon: "vagas", group: "more" },
  { href: "/pendencias", label: "Pendências", icon: "pendencias", group: "more" },
  { href: "/ajustes", label: "Ajustes", icon: "ajustes", group: "more" },
];

/** A tela atual é a do item ou uma filha dela (/clientes/123 acende Clientes). */
export const isNavActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
