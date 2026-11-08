"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer } from "vaul";
import type { Aviso } from "./core";

/** Sino em vidro que abre os avisos numa folha por cima da tela atual, sem trocar de página. */
export function NotificationsSheet({ avisos }: { avisos: Aviso[] }) {
  const [open, setOpen] = useState(false);
  const count = avisos.length;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        aria-label={count > 0 ? `Notificações, ${count} novas` : "Notificações"}
        className="btn-glass relative grid size-11 shrink-0 place-content-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4" />
        </svg>
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 grid min-w-5 place-content-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-on-primary ring-2 ring-white/80"
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pb-1 text-xl font-bold">Notificações</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            {count > 0 ? "O que precisa da sua atenção agora." : "Tudo em dia por aqui."}
          </Drawer.Description>
          {count === 0 ? (
            <p className="glass rounded-2xl px-4 py-3 text-sm font-semibold text-muted">
              Nenhum atendimento pendente, WhatsApp e Google Agenda conectados.
            </p>
          ) : (
            <ul className="grid gap-2">
              {avisos.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} onClick={() => setOpen(false)} className="glass block rounded-2xl px-4 py-3">
                    <span className="block font-bold">{a.title}</span>
                    <span className="block text-sm font-semibold text-muted">{a.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
