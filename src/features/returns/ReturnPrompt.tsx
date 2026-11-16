"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon } from "@/components/ui/Icon";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { formatShortDate } from "@/lib/dates";
import { loadReturnSuggestions, skipReturn, type ReturnSuggestion } from "./actions";

const OPEN = "ayumi:retorno";
const CANCEL = "ayumi:retorno-cancelar";

type Ask = { appointmentId: string; undo?: () => void; toastId?: string | number };

/**
 * Depois do Concluir: pergunta se já marca o retorno. Só abre se algum serviço tem retorno e a
 * cliente não tem horário marcado; senão o toast com Desfazer continua sozinho.
 */
export function openReturnPrompt(ask: Ask) {
  window.dispatchEvent(new CustomEvent<Ask>(OPEN, { detail: ask }));
}

/** Desfazer o Concluir antes de a pergunta abrir: ela não abre mais. */
export function cancelReturnPrompt(appointmentId: string) {
  window.dispatchEvent(new CustomEvent<string>(CANCEL, { detail: appointmentId }));
}

type Shown = Ask & { data: Extract<ReturnSuggestion, { kind: "suggest" }> };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** Folha "Marcar o retorno?" de qualquer tela (fica no layout, como o QuickBook). */
export function ReturnPrompt() {
  const side = useSheetSide();
  const [shown, setShown] = useState<Shown | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelled = useRef(new Set<string>());
  const current = useRef<string | null>(null);

  useEffect(() => {
    async function onOpen(e: Event) {
      const ask = (e as CustomEvent<Ask>).detail;
      cancelled.current.delete(ask.appointmentId);
      const res = await loadReturnSuggestions(ask.appointmentId).catch(() => null);
      // Falhou a sugestão: o atendimento já está concluído; fica só o toast, sem incomodar
      if (!res?.ok || res.data.kind !== "suggest" || cancelled.current.has(ask.appointmentId)) return;
      // A folha traz o próprio Desfazer; o toast por baixo dela não recebe o toque
      if (ask.toastId !== undefined) notify.dismiss(ask.toastId);
      current.current = ask.appointmentId;
      setShown({ ...ask, data: res.data });
      setOpen(true);
    }
    function onCancel(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      cancelled.current.add(id);
      if (current.current === id) setOpen(false);
    }
    window.addEventListener(OPEN, onOpen);
    window.addEventListener(CANCEL, onCancel);
    return () => {
      window.removeEventListener(OPEN, onOpen);
      window.removeEventListener(CANCEL, onCancel);
    };
  }, []);

  if (!shown) return null;
  const { data } = shown;
  const name = firstName(data.clientName);

  function book(preset: { date: string; time?: string }) {
    setOpen(false);
    openNewAppointment({ clientId: data.clientId, serviceIds: data.serviceIds, ...preset });
  }

  async function notNeeded() {
    setBusy(true);
    const res = await skipReturn(shown!.appointmentId).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setOpen(false);
      notify.success("Tudo certo", `${name} fica sem retorno desta vez.`);
    } else notify.error(res && !res.ok ? res.code : "NETWORK", () => void notNeeded());
  }

  function undo() {
    setOpen(false);
    shown!.undo?.();
  }

  const btn = "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-bold disabled:opacity-60";
  return (
    <Drawer.Root
      direction={side}
      repositionInputs={false}
      open={open}
      dismissible={!busy}
      onOpenChange={(v) => !busy && setOpen(v)}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          aria-busy={busy}
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl pt-4 outline-none",
            "sheet z-50 flex flex-col",
          )}
        >
          <SidePanelClose />
          <Drawer.Handle className="mb-3 md:hidden" />
          <div className={SHEET_SCROLL}>
            <p className="flex items-center gap-1.5 pb-2 text-sm font-semibold text-ok">
              <Icon name="checkCircle" size={16} />
              Atendimento concluído
              {shown.undo ? (
                <button type="button" onClick={undo} className="ml-auto min-h-11 px-2 font-bold text-primary-text">
                  Desfazer
                </button>
              ) : null}
            </p>
            <Drawer.Title className="pb-1 text-xl font-bold">Marcar o retorno de {name}?</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              {data.serviceLabel} · retorno previsto para <b className="text-fg">{formatShortDate(data.due)}</b>
            </Drawer.Description>

            {data.days.length ? (
              <div className="grid gap-3 pb-4">
                {data.days.map((d) => (
                  <section key={d.date} aria-label={formatShortDate(d.date)} className="glass rounded-2xl px-4 py-3">
                    <h3 className="pb-2 text-sm font-bold first-letter:uppercase">
                      {formatShortDate(d.date)}
                      {d.date === data.due ? <span className="font-semibold text-muted"> · data prevista</span> : null}
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {d.slots.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            onClick={() => book({ date: d.date, time: t })}
                            aria-label={`Agendar retorno ${formatShortDate(d.date)} às ${t}`}
                            className="min-h-11 rounded-full bg-soft px-4 text-sm font-bold text-primary-text active:scale-95"
                          >
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <p className="mb-4 rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                Sem horário livre perto dessa data. Escolha outro dia.
              </p>
            )}

            <div className="grid gap-2">
              <button type="button" onClick={() => book({ date: data.due })} className={`${btn} btn-tint`}>
                <Icon name="calendar" size={18} />
                Escolher outro dia
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setOpen(false)} disabled={busy} className={`${btn} btn-glass`}>
                  Agora não
                </button>
                <button
                  type="button"
                  onClick={() => void notNeeded()}
                  disabled={busy}
                  aria-busy={busy}
                  className={`${btn} btn-glass`}
                >
                  {busy ? <span className="spin" aria-hidden="true" /> : null}
                  {busy ? "Salvando…" : "Não precisa"}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
