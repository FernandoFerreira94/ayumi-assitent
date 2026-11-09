"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import type { PickerOption } from "@/components/ui/LetterPicker";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { timeOptions } from "@/lib/time-grid";
import { editAppointmentAction, loadBookingOptions } from "./actions";
import { warnSync } from "./sync-warning";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";

/** Folha para reagendar (dia/horário) ou trocar o serviço do atendimento, sem sair da agenda. */
export function EditAppointmentSheet({
  id,
  clientName,
  serviceId,
  serviceName,
  date,
  start,
  nested,
  triggerClassName,
}: {
  id: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  /** Dia atual do atendimento (AAAA-MM-DD) e horário (HH:MM), para começar preenchido. */
  date: string;
  start: string;
  nested: boolean;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<PickerOption[] | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  /** Mais de um serviço: a primeira opção mantém todos; escolher outra deixa só aquele. */
  const multi = serviceName.includes(" + ");

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    // Serviços só ao abrir: a linha do dia não carrega a lista para cada card
    if (next && !services)
      void loadBookingOptions().then((r) => setServices(r.ok ? r.data.services : [{ id: serviceId, label: serviceName }]));
  }

  function submit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await editAppointmentAction({
        id,
        serviceId: form.get("serviceId") === "keep" ? serviceId : String(form.get("serviceId")),
        single: multi && form.get("serviceId") !== "keep",
        date: String(form.get("date")),
        time: String(form.get("time")),
      }).catch(() => null);
      if (!res?.ok) {
        setError(res && !res.ok ? res.code : "NETWORK");
        return;
      }
      warnSync(res.data.sync);
      notify.success("Agendamento atualizado");
      setOpen(false);
    });
  }

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger className={triggerClassName}>Remarcar</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pb-1 text-xl font-bold">Editar {clientName.split(/\s+/)[0]}</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Mudou o horário? Ela recebe um lembrete novo para confirmar.
          </Drawer.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget));
            }}
            className="grid gap-3"
          >
            <label className="grid gap-1 text-sm font-bold">
              Serviço
              {services ? (
                <select name="serviceId" required defaultValue={multi ? "keep" : serviceId} className={input}>
                  {multi ? <option value="keep">{serviceName}</option> : null}
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                      {s.hint ? ` · ${s.hint}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="skel h-13 rounded-2xl" aria-label="Carregando serviços" />
              )}
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Dia
              <input name="date" type="date" required defaultValue={date} className={input} />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Horário
              <select name="time" required defaultValue={start} className={input} aria-invalid={error === "SLOT_TAKEN"}>
                {timeOptions({ include: start }).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            {error ? (
              <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
                {messageFor(error)}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending || !services}
              className="btn-tint mt-1 flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
            >
              {pending ? <span className="spin" aria-hidden="true" /> : null}
              {pending ? "Salvando…" : "Salvar"}
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}
