"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import type { PickerOption } from "@/components/ui/LetterPicker";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { timeOptions } from "@/lib/time-grid";
import type { Day } from "@/features/hours/slots";
import { editAppointmentAction, loadBookingOptions } from "./actions";
import { pauseOverlap, pauseWarning } from "./agenda-grid";
import { hhmm } from "./timeline";
import type { ServiceOption } from "./options";
import { PauseConfirm } from "./PauseConfirm";
import { warnSync } from "./sync-warning";
import { Switch } from "@/components/ui/Switch";
import { showRescheduleNotice } from "./reschedule-notice";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";
/** Dia e horário na mesma linha: altura fixa (o select do iOS ignora min-height) e texto centrado na vertical. */
const pair = "h-13 w-full min-w-0 rounded-2xl border px-3 py-3 text-base font-semibold";

/** Folha para reagendar (dia/horário) ou trocar o serviço do atendimento, sem sair da agenda. */
export function EditAppointmentSheet({
  id,
  clientName,
  serviceId,
  serviceName,
  date,
  start,
  minutes,
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
  /** Duração atual (todos os serviços), para avisar se o novo horário pega a pausa. */
  minutes?: number;
  nested: boolean;
  triggerClassName: string;
}) {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<(PickerOption & Partial<ServiceOption>)[] | null>(null);
  const [week, setWeek] = useState<Day[] | null>(null);
  const [pick, setPick] = useState({ date, time: start, serviceId: "" });
  const [pauseOk, setPauseOk] = useState<string | null>(null);
  const [askPause, setAskPause] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  /** Avisar a cliente no WhatsApp se o dia/horário mudar (desliga só desta vez) */
  const [notifyClient, setNotifyClient] = useState(true);
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  /** Mais de um serviço: a primeira opção mantém todos; escolher outra deixa só aquele. */
  const multi = serviceName.includes(" + ");

  // Mesma regra do servidor: manter o serviço mantém a duração; trocar usa a do serviço escolhido
  const keep = !pick.serviceId || pick.serviceId === "keep" || (!multi && pick.serviceId === serviceId);
  const length = keep ? (minutes ?? 0) : (services?.find((s) => s.id === pick.serviceId)?.durationMin ?? 0);
  const pause = pauseOverlap({ date: pick.date, time: pick.time, minutes: length, week });
  const pickKey = `${pick.date}|${pick.time}|${length}`;
  const asking = askPause && pause !== null && pauseOk !== pickKey;
  const formId = `editar-${id}`;

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    setAskPause(false);
    if (next) setPick({ date, time: start, serviceId: "" });
    if (next) setNotifyClient(true);
    // Serviços só ao abrir: a linha do dia não carrega a lista para cada card
    if (next && !services)
      void loadBookingOptions().then((r) => {
        setServices(r.ok ? r.data.services : [{ id: serviceId, label: serviceName }]);
        if (r.ok) setWeek(r.data.week ?? null);
      });
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
        notify: notifyClient,
      }).catch(() => null);
      if (!res?.ok) {
        setError(res && !res.ok ? res.code : "NETWORK");
        return;
      }
      warnSync(res.data.sync);
      notify.success("Agendamento atualizado");
      showRescheduleNotice(res.data.notice, clientName);
      setOpen(false);
    });
  }

  return (
    <Root direction={side} open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Trigger className={triggerClassName}>
        <Icon name="reschedule" size={18} />
        Remarcar
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl pt-4 outline-none", "sheet z-50 flex flex-col")}>
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pb-1 text-xl font-bold">Editar {clientName.split(/\s+/)[0]}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Mudou o horário? Ela recebe o aviso no WhatsApp e confirma o horário novo.
            </Drawer.Description>
            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault();
                if (pause && pauseOk !== pickKey) return setAskPause(true);
                submit(new FormData(e.currentTarget));
              }}
              className="grid gap-3"
            >
              <label className="grid gap-1 text-sm font-bold">
                Serviço
                {services ? (
                  <select
                    name="serviceId"
                    required
                    defaultValue={multi ? "keep" : serviceId}
                    className={input}
                    onChange={(e) => setPick((p) => ({ ...p, serviceId: e.target.value }))}
                  >
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
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
                <label className="grid min-w-0 gap-1 text-sm font-bold">
                  Dia
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={date}
                    className={pair}
                    onChange={(e) => setPick((p) => ({ ...p, date: e.target.value }))}
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-sm font-bold">
                  Horário
                  <select
                    name="time"
                    required
                    id={`${formId}-hora`}
                    defaultValue={start}
                    className={pair}
                    aria-invalid={error === "SLOT_TAKEN"}
                    aria-describedby={pause ? `${formId}-pausa` : undefined}
                    onChange={(e) => setPick((p) => ({ ...p, time: e.target.value }))}
                  >
                    {timeOptions({ include: start }).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              {pause && !asking ? (
                <p
                  id={`${formId}-pausa`}
                  role="status"
                  className="flex items-center gap-2 rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait"
                >
                  <Icon name="alert" size={18} />
                  {pauseWarning(pause)}. Dá para salvar mesmo assim.
                </p>
              ) : null}
              <div className="flex min-h-11 items-center justify-between gap-3">
                <span className="text-sm font-bold">
                  Avisar {clientName.split(/\s+/)[0]} no WhatsApp
                </span>
                <Switch checked={notifyClient} onChange={setNotifyClient} label="Avisar a cliente no WhatsApp" />
              </div>
              {error ? (
                <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
                  {messageFor(error)}
                </p>
              ) : null}
              {asking && pause ? (
                <PauseConfirm
                  pause={`${hhmm(pause.start)} às ${hhmm(pause.end)}`}
                  confirmLabel="Salvar mesmo assim"
                  onPickAnother={() => {
                    setAskPause(false);
                    document.getElementById(`${formId}-hora`)?.focus();
                  }}
                  onConfirm={() => {
                    setPauseOk(pickKey);
                    setAskPause(false);
                    const form = document.getElementById(formId);
                    if (form instanceof HTMLFormElement) submit(new FormData(form));
                  }}
                />
              ) : (
              <button
                type="submit"
                disabled={pending || !services}
                className="btn-tint mt-1 flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
              >
                {pending ? <span className="spin" aria-hidden="true" /> : null}
                {pending ? "Salvando…" : "Salvar"}
              </button>
              )}
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}
