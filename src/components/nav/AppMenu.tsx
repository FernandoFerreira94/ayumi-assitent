"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Mascot } from "@/components/brand/Mascot";
import type { WhatsAppState } from "@/features/shell/status";
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
  {
    href: "/agenda",
    label: "Painel",
    icon: icon(
      <>
        <rect x="3" y="3" width="8" height="8" rx="2.5" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="11" width="8" height="10" rx="2.5" />
        <rect x="3" y="14" width="8" height="7" rx="2" />
      </>,
    ),
  },
  {
    href: "/calendario",
    label: "Calendário",
    icon: icon(
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>,
    ),
  },
  {
    href: "/servicos",
    label: "Serviços",
    icon: icon(
      <>
        <path d="M6 3l12 12M18 3L6 15" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
      </>,
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: icon(
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
      </>,
    ),
  },
  {
    href: "/vagas",
    label: "Vagas",
    icon: icon(
      <>
        <path d="M12 7v5l3 2" />
        <circle cx="12" cy="12" r="9" />
      </>,
    ),
  },
  {
    href: "/pendencias",
    label: "Pendências",
    icon: icon(
      <>
        <path d="M9 12l2 2 4-4" />
        <rect x="4" y="3" width="16" height="18" rx="3" />
      </>,
    ),
  },
  {
    href: "/ajustes",
    label: "Ajustes",
    icon: icon(
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2.5" />
        <circle cx="15" cy="17" r="2.5" />
      </>,
    ),
  },
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
 * Avatar do header que abre o menu numa folha de vidro que desce do topo, sem trocar de página.
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
        onClick={() => ref.current?.showModal()}
        className="avatar grid size-11 shrink-0 place-content-center rounded-full text-sm font-bold text-white"
      >
        {abbr}
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
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
        <div className="mx-auto grid max-w-[520px] gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]">
          <Link href="/perfil" onClick={close} aria-label="Meu perfil" className="flex items-center gap-3">
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
          <Link
            href="/perfil"
            onClick={close}
            className="btn-tint flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold"
          >
            Meu perfil
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
                    className="relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface px-1 py-3 text-center text-[13px] font-semibold hover:bg-soft aria-[current=page]:bg-soft"
                  >
                    {item.icon}
                    {item.label}
                    {badge ? (
                      <span className="absolute right-2 top-1.5 rounded-full bg-fail px-1.5 text-[11px] font-bold leading-5 text-white">
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
            <span className="px-2.5 font-mono text-[11px] text-muted">Mimo {version}</span>
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
