"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ActionResult } from "@/lib/errors";
import { timeOptions } from "@/lib/time-grid";
import { createBlock } from "./actions";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";
/** De 15 em 15, como a agenda: dá para bloquear 12:15–12:45. */
const TIMES = timeOptions();

export function NewBlockSheet({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const keyboard = useKeyboardInset(open);
  const [state, action] = useActionState(async (prev: ActionResult<{ id: string }> | null, fd: FormData) => {
    const res = await createBlock(prev, fd);
    if (res.ok) {
      notify.success("Horário bloqueado");
      setOpen(false);
    } else if (res.code !== "VALIDATION" && res.code !== "HAS_APPOINTMENTS") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok ? state : null;

  return (
    <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="5" y="10.5" width="14" height="10" rx="3" />
          <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
        </svg>
        Bloquear
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
          style={keyboard}
        >
          <Drawer.Title className="pb-1 text-xl font-bold">Bloquear horário</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Pausa, almoço ou folga: esse período some das vagas.
          </Drawer.Description>
          <form action={action} className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">
              Dia
              <input name="date" type="date" required defaultValue={date} className={input} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">
                Início
                <select name="start" className={input} defaultValue="12:00">
                  {TIMES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Fim
                <select name="end" className={input} defaultValue="13:00" aria-invalid={err?.field === "end"}>
                  {TIMES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              Motivo (opcional)
              <input
                name="reason"
                maxLength={80}
                placeholder="Ex.: Almoço, consulta, folga"
                className={input}
                autoComplete="off"
              />
            </label>
            {err?.code === "HAS_APPOINTMENTS" ? (
              <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                {messageFor("HAS_APPOINTMENTS")}
              </p>
            ) : null}
            {err?.code === "VALIDATION" ? (
              <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                {err.field === "end" ? "O fim precisa ser depois do início." : messageFor("VALIDATION")}
              </p>
            ) : null}
            <SubmitButton pendingLabel="Bloqueando…">Bloquear</SubmitButton>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
