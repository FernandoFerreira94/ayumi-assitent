"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ActionResult } from "@/lib/errors";
import { createBlock } from "./actions";

const input =
  "min-h-13 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold outline-none focus:border-primary";
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});

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
      <Drawer.Trigger className="min-h-11 rounded-full bg-soft px-5 text-sm font-bold text-primary-text active:scale-[0.97]">
        Bloquear
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl bg-bg px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none" style={keyboard}>
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
              <input name="reason" maxLength={80} placeholder="Almoço" className={input} autoComplete="off" />
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
