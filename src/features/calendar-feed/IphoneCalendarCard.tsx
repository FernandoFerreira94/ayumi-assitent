"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { createCalendarLink, disableCalendarLink, setCalendarHideNames } from "./actions";

const STEPS = [
  <>
    Toque em <b>Adicionar ao iPhone</b> e depois em <b>Assinar</b>.
  </>,
  <>
    Se não abrir: toque em <b>Copiar link</b>, vá em Ajustes do iPhone › <b>Calendário</b> › <b>Contas</b> ›{" "}
    <b>Adicionar Conta</b> › <b>Outra</b> › <b>Adicionar Calendário Assinado</b> e cole o link.
  </>,
  <>
    Pronto: os agendamentos aparecem no app Calendário. O iPhone atualiza sozinho de 15 em 15 minutos até 1 hora (em
    Ajustes › Calendário › Contas › <b>Obter Dados</b>).
  </>,
];

/**
 * Calendário do iPhone (iCloud): link assinado só de leitura com os agendamentos.
 * Quem usa o Google Agenda já vê tudo pelo Google; o sheet avisa para não usar os dois e duplicar.
 */
export function IphoneCalendarCard({
  enabled: initialEnabled,
  hideNames: initialHide,
  googleConnected,
}: {
  enabled: boolean;
  hideNames: boolean;
  googleConnected: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [hideNames, setHideNames] = useState(initialHide);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "create" | "hide" | "off">(null);
  const [confirmOff, setConfirmOff] = useState(false);

  async function create() {
    setBusy("create");
    const res = await createCalendarLink().catch(() => null);
    setBusy(null);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK", create);
    setUrl(res.data.url);
    setEnabled(true);
    notify.success(
      enabled ? "Link novo criado" : "Link criado",
      enabled ? "O link antigo parou de funcionar." : undefined,
    );
  }

  async function off() {
    setBusy("off");
    const res = await disableCalendarLink().catch(() => null);
    setBusy(null);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK", off);
    setEnabled(false);
    setUrl(null);
    setConfirmOff(false);
    notify.success("Link desligado", "Apague a assinatura no iPhone se ela ainda aparecer.");
  }

  async function toggleHide(next: boolean) {
    setBusy("hide");
    setHideNames(next);
    const res = await setCalendarHideNames(next).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setHideNames(!next);
      return notify.error(res ? res.code : "NETWORK");
    }
    notify.success(next ? "Nomes ocultos no calendário" : "Nomes visíveis no calendário");
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      notify.success("Link copiado");
    } catch {
      notify.error("CLIPBOARD");
    }
  }

  let hint = "Veja os agendamentos no app Calendário do iPhone.";
  if (enabled) hint = "Ligado. Os agendamentos aparecem no Calendário do iPhone.";
  if (!enabled && googleConnected) hint = "Você já vê pelo Google Agenda. Toque para ver como.";

  return (
    <Drawer.Root>
      <Drawer.Trigger className="flex w-full items-center justify-between gap-3 glass rounded-[1.75rem] px-5 py-4 text-left">
        <span>
          <TileTitle icon="calendar" tint="red">
            Calendário do iPhone
          </TileTitle>
          <span className="block text-sm font-semibold text-muted">{hint}</span>
        </span>
        <span className="text-sm font-bold text-primary-text">{enabled ? "Ligado" : "Configurar"}</span>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pt-2 text-center text-xl font-bold">Calendário do iPhone</Drawer.Title>
          <Drawer.Description className="pb-4 text-center text-sm font-semibold text-muted">
            Seus agendamentos no app Calendário, atualizados sozinhos. Só leitura: mudanças são feitas aqui no app.
          </Drawer.Description>

          <div className="grid gap-4">
            {googleConnected ? (
              <div className="glass grid gap-1 rounded-2xl px-4 py-3 text-sm font-semibold" role="note">
                <p className="font-bold">Você usa o Google Agenda</p>
                <p className="text-muted">
                  Os agendamentos já vão para o Google. No iPhone, adicione a conta Google em Ajustes › Calendário ›
                  Contas › Adicionar Conta › <b>Google</b>. Use só um dos dois caminhos, senão cada agendamento aparece
                  duas vezes.
                </p>
              </div>
            ) : null}

            {url ? (
              <div className="grid gap-2">
                <a
                  href={url.replace(/^https?:/, "webcal:")}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-bold text-on-primary"
                >
                  <Icon name="calendar" size={20} />
                  Adicionar ao iPhone
                </a>
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="btn-glass min-h-12 rounded-full px-5 text-sm font-bold"
                >
                  Copiar link
                </button>
                <p className="px-1 text-xs font-semibold text-muted">
                  Quem tem este link vê sua agenda. Não envie para ninguém. Por segurança ele só aparece agora.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void create()}
                disabled={busy !== null}
                aria-busy={busy === "create"}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-60 ${
                  enabled || googleConnected ? "btn-glass text-sm" : "bg-primary text-on-primary"
                }`}
              >
                {busy === "create" ? "Criando…" : enabled ? "Gerar link novo" : "Criar link do calendário"}
              </button>
            )}
            {enabled && !url ? (
              <p className="-mt-2 px-1 text-xs font-semibold text-muted">
                O link já está ligado. Para pôr em outro aparelho, gere um novo: o antigo para de funcionar.
              </p>
            ) : null}

            <ol className="grid gap-2">
              {STEPS.map((step, i) => (
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

            <div className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <div>
                <p className="text-sm font-bold">Ocultar nome da cliente</p>
                <p className="text-xs font-semibold text-muted">Mostra só o serviço, ex.: “Atendimento · Corte”.</p>
              </div>
              <Switch
                checked={hideNames}
                onChange={(v) => void toggleHide(v)}
                busy={busy === "hide"}
                label="Ocultar nome da cliente"
              />
            </div>

            {enabled ? (
              confirmOff ? (
                <div className="grid grid-cols-2 gap-2" role="alertdialog" aria-label="Desligar o link?">
                  <button
                    type="button"
                    className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                    onClick={() => setConfirmOff(false)}
                    disabled={busy === "off"}
                    autoFocus
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-full bg-fail px-4 text-sm font-bold text-white disabled:opacity-60"
                    onClick={() => void off()}
                    disabled={busy === "off"}
                    aria-busy={busy === "off"}
                  >
                    {busy === "off" ? "Desligando…" : "Desligar"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmOff(true)}
                  className="min-h-11 px-3 text-sm font-bold text-fail"
                >
                  Desligar link
                </button>
              )
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
