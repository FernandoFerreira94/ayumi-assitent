"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import type { WhatsAppState } from "@/features/shell/status";
import { NAV_ICONS } from "./nav-icons";
import { SignOutButton } from "./SignOutButton";

const icon = (d: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    className="size-5 shrink-0 text-primary-text"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
);

const ITEMS = [
  { href: "/vagas", label: "Vagas", icon: icon(NAV_ICONS.vagas) },
  { href: "/servicos", label: "Serviços", icon: icon(NAV_ICONS.servicos) },
  { href: "/financeiro", label: "Financeiro", icon: icon(NAV_ICONS.financeiro) },
  { href: "/pendencias", label: "Pendências", icon: icon(NAV_ICONS.pendencias) },
  { href: "/ajustes", label: "Ajustes", icon: icon(NAV_ICONS.ajustes) },
] as const;

/** Arrastar a folha para cima mais que isso fecha; menos, ela volta. */
const DRAG_CLOSE_PX = 60;

export function initials(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}

/**
 * Avatar na ponta da barra de abas: abre o menu (as telas que não têm aba) numa folha de vidro
 * que desce do topo, sem trocar de página.
 * <dialog> modal dá foco preso, Esc e fundo inerte de graça.
 */
export function AppMenu({
  userName,
  studioName,
  whatsapp,
  pendencias,
  version,
}: {
  userName: string | null;
  studioName: string | null;
  whatsapp: WhatsAppState;
  pendencias: number;
  version: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const dragFrom = useRef<number | null>(null);
  const pathname = usePathname();
  const abbr = initials(userName);
  const [open, setOpen] = useState(false);
  // Anel no avatar quando a tela atual é uma das do menu, como o perfil no Instagram
  const here = ITEMS.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  const close = () => ref.current?.close();
  const follow = (dy: number) => {
    // Só acompanha o dedo para cima; para baixo a folha já está no lugar
    if (ref.current) ref.current.style.translate = dy < 0 ? `0 ${dy}px` : "";
  };
  const endDrag = (y: number) => {
    if (dragFrom.current === null) return;
    const dy = y - dragFrom.current;
    dragFrom.current = null;
    follow(0);
    if (dy < -DRAG_CLOSE_PX) close();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-current={here ? "page" : undefined}
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
        className="tab-link w-full"
      >
        <span className="tab-icon">
          <span className="avatar tab-avatar">{abbr}</span>
        </span>
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        // Toque no fundo: o alvo é o próprio <dialog>, porque o conteúdo fica num div por dentro
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") dragFrom.current = e.clientY;
        }}
        onPointerMove={(e) => {
          if (dragFrom.current !== null) follow(e.clientY - dragFrom.current);
        }}
        onPointerUp={(e) => endDrag(e.clientY)}
        onPointerCancel={() => endDrag(dragFrom.current ?? 0)}
        className="app-menu"
      >
        <div className="status-fill" aria-hidden="true" />
        <div className="mx-auto grid max-w-[520px] gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]">
          <Link href="/perfil" onClick={close} aria-label="Meu perfil" className="profile-link flex items-center gap-3">
            <span
              aria-hidden="true"
              className="avatar grid size-13 shrink-0 place-content-center rounded-full text-[17px] font-bold text-white"
            >
              {abbr}
            </span>
            <div className="min-w-0">
              <b className="block truncate text-[17px] leading-tight">{userName ?? "Você"}</b>
              {studioName ? (
                <span className="block truncate text-sm font-semibold text-muted">{studioName}</span>
              ) : null}
            </div>
            <Mascot idle size={64} className="ml-auto shrink-0" />
          </Link>
          {whatsapp === "open" ? (
            <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-ok-bg px-2.5 py-1 text-xs font-bold text-ok">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
              WhatsApp conectado
            </span>
          ) : whatsapp === "other" ? (
            <Link
              href="/ajustes#whatsapp"
              onClick={close}
              className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-fail-bg px-2.5 py-1 text-xs font-bold text-fail"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-fail" />
              WhatsApp desconectado, toque para reconectar
            </Link>
          ) : null}
          <ul className="grid grid-cols-3 gap-2">
            {ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge = item.href === "/pendencias" && pendencias > 0 ? pendencias : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className="relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface px-1 py-3 text-center text-[13px] font-semibold shadow-[0_6px_16px_-6px_rgba(40,24,110,0.28)] hover:bg-soft aria-[current=page]:bg-soft"
                  >
                    {item.icon}
                    {item.label}
                    {badge ? (
                      <span className="absolute right-2 top-1.5 rounded-full bg-fail px-1.5 text-xs font-bold leading-5 text-white">
                        <span className="sr-only">, </span>
                        {badge > 9 ? "9+" : badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SignOutButton />
            <span className="px-2.5 font-mono text-xs text-muted">Mimo {version}</span>
          </div>
          <button type="button" onClick={close} className="sr-only focus:not-sr-only">
            Fechar menu
          </button>
          {/* Puxador embaixo: é dali que o polegar arrasta a folha de volta para cima */}
          <span aria-hidden="true" className="h-[5px] w-10 justify-self-center rounded-full bg-line" />
        </div>
      </dialog>
    </>
  );
}
