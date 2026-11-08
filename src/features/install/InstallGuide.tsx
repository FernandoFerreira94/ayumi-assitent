"use client";

import { useSyncExternalStore } from "react";
import { Drawer } from "vaul";
import { Mascot } from "@/components/brand/Mascot";
import { detectPlatform, type InstallPlatform } from "./platform";

const STANDALONE = "(display-mode: standalone)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(STANDALONE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** null = já instalado (aberto pelo ícone) ou ainda no servidor: não há o que ensinar. */
function snapshot(): InstallPlatform | null {
  const installed = window.matchMedia(STANDALONE).matches || (navigator as { standalone?: boolean }).standalone === true;
  return installed ? null : detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
}

const ShareIcon = (
  <svg viewBox="0 0 24 24" className="inline size-[18px] align-[-3px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="ícone de Compartilhar" role="img">
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
  </svg>
);

const STEPS: Record<"ios" | "android", { title: string; steps: React.ReactNode[] }> = {
  ios: {
    title: "No iPhone (Safari)",
    steps: [
      <>Toque em Compartilhar {ShareIcon} na barra do Safari. Se não aparecer, toque antes em •••.</>,
      <>Role a lista e toque em <b>Adicionar à Tela de Início</b>.</>,
      <>Toque em <b>Adicionar</b>. O app passa a abrir pelo ícone do Mimo.</>,
    ],
  },
  android: {
    title: "No Android (Chrome)",
    steps: [
      <>Toque no menu ⋮ no canto de cima do Chrome.</>,
      <>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</>,
      <>Confirme em <b>Instalar</b>. O ícone do Mimo aparece com os outros apps.</>,
    ],
  },
};

/** Botão que abre o passo a passo para pôr o app na tela de início; some quando o app já está instalado. */
export function InstallGuide({ compact = false }: { compact?: boolean }) {
  const platform = useSyncExternalStore(subscribe, snapshot, () => null);
  if (!platform) return null;
  // Computador: não dá para saber qual celular ela usa, então mostra os dois caminhos
  const guides = platform === "other" ? (["ios", "android"] as const) : [platform];

  return (
    <Drawer.Root>
      <Drawer.Trigger
        className={
          compact
            ? "mx-auto min-h-11 px-3 text-sm font-bold text-primary-text"
            : "btn-glass min-h-12 w-full rounded-full px-5 text-sm font-bold"
        }
      >
        Como instalar o app no celular
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Mascot mood="happy" size={72} className="mx-auto" />
          <Drawer.Title className="pt-2 text-center text-xl font-bold">Instalar na tela de início</Drawer.Title>
          <Drawer.Description className="pb-4 text-center text-sm font-semibold text-muted">
            {platform === "other"
              ? "Abra este endereço no celular e siga os passos."
              : "Fica como um app: abre direto na agenda, em tela cheia."}
          </Drawer.Description>
          <div className="grid gap-4">
            {guides.map((g) => (
              <section key={g} aria-label={STEPS[g].title} className="grid gap-2">
                {guides.length > 1 ? <h3 className="px-1 text-sm font-bold uppercase tracking-wide text-muted">{STEPS[g].title}</h3> : null}
                <ol className="grid gap-2">
                  {STEPS[g].steps.map((step, i) => (
                    <li key={i} className="glass grid grid-cols-[28px_1fr] items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold">
                      <span className="grid size-7 place-content-center rounded-full bg-soft font-bold text-primary-text" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {platform !== "android" ? (
              <p className="px-1 text-xs font-semibold text-muted">
                Abriu o link pelo Instagram ou WhatsApp? Toque em ••• e escolha abrir no Safari antes.
              </p>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
