"use client";

import { useActionState, useEffect, useState } from "react";
import { Drawer } from "vaul";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { Mascot } from "@/components/brand/Mascot";
import { notify } from "@/components/feedback/toast";
import { LetterPicker, type PickerOption } from "@/components/ui/LetterPicker";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { messageFor, type ActionResult } from "@/lib/errors";
import { warnSync } from "./sync-warning";
import { createAppointment } from "./actions";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";
const TIMES = Array.from({ length: 29 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});
/** Tempo da comemoração antes de a folha fechar sozinha. */
const DONE_MS = 1600;

type Phase = "form" | "saving" | "done";

export function NewAppointmentSheet({
  date,
  clients,
  services,
  openKey,
}: {
  date: string;
  /** null enquanto as opções chegam (a folha do "Novo" do nav busca na hora de abrir). */
  clients: PickerOption[] | null;
  services: PickerOption[] | null;
  /** Aberta pelo "Novo" do nav: sem botão próprio, e cada valor novo abre a folha. */
  openKey?: number;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [prevKey, setPrevKey] = useState(openKey);
  if (openKey !== prevKey) {
    setPrevKey(openKey);
    setOpen(true);
    setPhase("form");
  }
  const keyboard = useKeyboardInset(open);
  const [state, action] = useActionState(async (prev: ActionResult<{ id: string }> | null, fd: FormData) => {
    const res = await createAppointment(prev, fd);
    if (res.ok) {
      setPhase("done");
      warnSync(res.data.sync);
    } else {
      setPhase("form");
      if (res.code !== "VALIDATION" && res.code !== "SLOT_TAKEN") notify.error(res.code);
    }
    return res;
  }, null);
  const err = state && !state.ok ? state : null;
  const loading = clients === null || services === null;
  const missing = !loading && (clients.length === 0 || services.length === 0);

  useEffect(() => {
    if (phase !== "done") return;
    const id = setTimeout(() => {
      setOpen(false);
      notify.success("Agendamento criado");
    }, DONE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  return (
    <Drawer.Root
      repositionInputs={false}
      open={open}
      onOpenChange={(next) => {
        // Enquanto salva, arrastar para baixo não pode largar o pedido no meio
        if (!next && phase === "saving") return;
        setOpen(next);
        if (next) setPhase("form");
      }}
    >
      {openKey === undefined ? (
        <Drawer.Trigger className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
            <path d="M8 3v3.5M16 3v3.5M12 10.5v6M9 13.5h6" />
          </svg>
          Agendar
        </Drawer.Trigger>
      ) : null}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none" style={keyboard}>
          <Drawer.Title className="pb-1 text-xl font-bold">Novo agendamento</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            {missing
              ? "Cadastre ao menos uma cliente (em Clientes) e um serviço (em Ajustes)."
              : "Escolha cliente, serviço e horário."}
          </Drawer.Description>
          {loading ? (
            <LoadingRegion label="Carregando clientes e serviços">
              <div className="grid gap-3">
                <Skeleton className="h-13 w-full rounded-2xl" />
                <Skeleton className="h-13 w-full rounded-2xl" />
                <Skeleton className="h-13 w-full rounded-2xl" />
              </div>
            </LoadingRegion>
          ) : missing ? null : phase === "form" ? (
            <form action={action} onSubmit={() => setPhase("saving")} className="grid gap-3">
              <LetterPicker name="clientId" label="Cliente" placeholder="Escolha a cliente…" options={clients} />
              <LetterPicker name="serviceId" label="Serviço" placeholder="Escolha o serviço…" options={services} />
              <label className="grid gap-1 text-sm font-bold">
                Dia
                <input name="date" type="date" required defaultValue={date} className={input} />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Horário
                <select name="time" required className={input} defaultValue="09:00" aria-invalid={err?.field === "time"}>
                  {TIMES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              {err?.code === "SLOT_TAKEN" || err?.code === "VALIDATION" ? (
                <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                  {messageFor(err.code)}
                </p>
              ) : null}
              <button type="submit" className="btn-tint mt-1 flex min-h-13 items-center justify-center rounded-full px-5 font-bold">
                Agendar
              </button>
            </form>
          ) : (
            <BookingProgress done={phase === "done"} />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Barra que enche enquanto salva (como a do Nubank) e vira a Bolha feliz ao concluir. */
function BookingProgress({ done }: { done: boolean }) {
  return (
    <div role="status" aria-live="polite" className="grid justify-items-center gap-4 py-8 text-center">
      <div className={done ? "mascot-hop" : "opacity-60"}>
        <Mascot mood={done ? "happy" : "neutral"} size={112} />
      </div>
      <p className="text-lg font-bold">{done ? "Agendado!" : "Agendando…"}</p>
      <div className="h-2.5 w-full max-w-64 overflow-hidden rounded-full bg-soft">
        <div className={`h-full rounded-full bg-primary ${done ? "booking-bar-done" : "booking-bar"}`} />
      </div>
    </div>
  );
}
