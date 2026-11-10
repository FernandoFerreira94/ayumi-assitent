"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { Mascot } from "@/components/brand/Mascot";
import { Icon } from "@/components/ui/Icon";
import { useInstall, type InstallState } from "./useInstall";

const NUDGE_KEY = "mimo:install-nudge";

const ShareIcon = (
  <svg
    viewBox="0 0 24 24"
    className="inline size-[18px] align-[-3px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="ícone de Compartilhar"
    role="img"
  >
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
  </svg>
);

const STEPS: Record<"ios" | "android", { title: string; steps: React.ReactNode[] }> = {
  ios: {
    title: "No iPhone (Safari)",
    steps: [
      <>Toque em Compartilhar {ShareIcon} na barra do Safari. Se não aparecer, toque antes em •••.</>,
      <>
        Role a lista e toque em <b>Adicionar à Tela de Início</b>.
      </>,
      <>
        Toque em <b>Adicionar</b>. O app passa a abrir pelo ícone do Bubbly.
      </>,
    ],
  },
  android: {
    title: "No Android (Chrome)",
    steps: [
      <>Toque no menu ⋮ no canto de cima do Chrome.</>,
      <>
        Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
      </>,
      <>
        Confirme em <b>Instalar</b>. O ícone do Bubbly aparece com os outros apps.
      </>,
    ],
  },
};

/** Passo a passo em sheet; no Android com instalador nativo disponível, oferece "Instalar agora". */
export function InstallSheet({
  install,
  open,
  onOpenChange,
  children,
}: {
  install: InstallState;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const { platform, canPrompt, prompt } = install;
  // Computador: não dá para saber qual celular ela usa, então mostra os dois caminhos
  const guides = platform === "other" ? (["ios", "android"] as const) : [platform];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {children}
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
            {canPrompt ? (
              <button
                type="button"
                onClick={() => {
                  void prompt();
                  onOpenChange?.(false);
                }}
                className="flex min-h-12 bg-primary text-on-primary items-center justify-center gap-2 rounded-full px-5 font-bold"
              >
                <Icon name="download" size={20} />
                Instalar agora
              </button>
            ) : null}
            {guides.map((g) => (
              <section key={g} aria-label={STEPS[g].title} className="grid gap-2">
                {guides.length > 1 ? (
                  <h3 className="px-1 text-sm font-bold uppercase tracking-wide text-muted">{STEPS[g].title}</h3>
                ) : null}
                <ol className="grid gap-2">
                  {STEPS[g].steps.map((step, i) => (
                    <li
                      key={i}
                      className="glass grid grid-cols-[28px_1fr] items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      <span
                        className="grid size-7 place-content-center rounded-full bg-soft font-bold text-primary-text"
                        aria-hidden="true"
                      >
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

/** Botão que abre o passo a passo para pôr o app na tela de início; some quando o app já está instalado. */
export function InstallGuide({ compact = false }: { compact?: boolean }) {
  const install = useInstall();
  if (!install) return null;
  return (
    <InstallSheet install={install}>
      <Drawer.Trigger
        className={
          compact
            ? "mx-auto min-h-11 px-3 text-sm font-bold text-primary-text"
            : "btn-glass min-h-12 w-full rounded-full px-5 text-sm font-bold"
        }
      >
        Como instalar o app no celular
      </Drawer.Trigger>
    </InstallSheet>
  );
}

/**
 * Ícone de download no header (ao lado do sino) enquanto o app não está instalado, e um aviso no topo
 * uma vez por dia convidando a instalar. Tocar em qualquer um abre o passo a passo.
 */
export function InstallHeaderButton() {
  const install = useInstall();
  const [open, setOpen] = useState(false);
  const show = install !== null;

  useEffect(() => {
    if (!show) return;
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
    try {
      if (localStorage.getItem(NUDGE_KEY) === today) return;
      localStorage.setItem(NUDGE_KEY, today);
    } catch {
      return; // sem armazenamento não dá para limitar a uma vez por dia: melhor não insistir
    }
    // Espera a tela assentar antes de falar com ela
    const t = setTimeout(
      () =>
        notify.invite("Instale o app", "Abre direto da tela de início e fica bem mais rápido.", () => setOpen(true)),
      1200,
    );
    return () => clearTimeout(t);
  }, [show]);

  if (!install) return null;
  return (
    <InstallSheet install={install} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        aria-label="Instalar o app"
        data-tour="install"
        className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
      >
        <Icon name="download" size={24} />
      </Drawer.Trigger>
    </InstallSheet>
  );
}
