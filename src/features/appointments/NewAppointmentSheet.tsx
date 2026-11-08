"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { formatBRL } from "@/lib/dates";
import { messageFor, type ActionResult } from "@/lib/errors";
import { warnSync } from "./sync-warning";
import { createAppointment } from "./actions";

type Option = { id: string; label: string };
const input =
  "min-h-13 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold outline-none focus:border-primary";
const TIMES = Array.from({ length: 29 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});

export function NewAppointmentSheet({
  date,
  clients,
  services,
}: {
  date: string;
  clients: Option[];
  services: (Option & { priceCents: number })[];
}) {
  const [open, setOpen] = useState(false);
  const keyboard = useKeyboardInset(open);
  const [state, action] = useActionState(async (prev: ActionResult<{ id: string }> | null, fd: FormData) => {
    const res = await createAppointment(prev, fd);
    if (res.ok) {
      notify.success("Agendamento criado");
      warnSync(res.data.sync);
      setOpen(false);
    } else if (res.code !== "VALIDATION" && res.code !== "SLOT_TAKEN") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok ? state : null;
  const missing = clients.length === 0 || services.length === 0;

  return (
    <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-on-primary active:scale-[0.97]">
        Agendar
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-[520px] overflow-y-auto rounded-t-3xl bg-bg px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none" style={keyboard}>
          <Drawer.Title className="pb-1 text-xl font-bold">Novo agendamento</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            {missing
              ? "Cadastre ao menos uma cliente (aba Clientes) e um serviço (aba Ajustes)."
              : "Escolha cliente, serviço e horário."}
          </Drawer.Description>
          {missing ? null : (
            <form action={action} className="grid gap-3">
              <label className="grid gap-1 text-sm font-bold">
                Cliente
                <select name="clientId" required className={input} defaultValue="">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Serviço
                <select name="serviceId" required className={input} defaultValue="">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} · {formatBRL(s.priceCents)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-bold">
                  Dia
                  <input name="date" type="date" required defaultValue={date} className={input} />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Horário
                  <select
                    name="time"
                    required
                    className={input}
                    defaultValue="09:00"
                    aria-invalid={err?.field === "time"}
                  >
                    {TIMES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              {err?.code === "SLOT_TAKEN" ? (
                <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                  {messageFor("SLOT_TAKEN")}
                </p>
              ) : null}
              {err?.code === "VALIDATION" ? (
                <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                  {messageFor("VALIDATION")}
                </p>
              ) : null}
              <SubmitButton pendingLabel="Agendando…">Agendar</SubmitButton>
            </form>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
