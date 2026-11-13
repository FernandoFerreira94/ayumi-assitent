"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { LetterPicker, type PickerOption } from "@/components/ui/LetterPicker";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { formatDayTitle } from "@/lib/dates";
import { timeOptions } from "@/lib/time-grid";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { whatsappStatus } from "@/features/whatsapp/actions";
import { BookingOverlay, type Booking, type Step } from "./BookingOverlay";
import { BookingServices } from "./BookingServices";
import type { ServiceOption } from "./options";
import { warnSync } from "./sync-warning";
import { createAppointment } from "./actions";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";
/** Mesmo com resposta instantânea a Bolha trabalha um pouco, para a tela não piscar. */
const MIN_MS = 900;
const SLOW_MS = 4000;
const GIVE_UP_MS = 15000;
/** Tempo do "Agendado!" antes de a tela fechar sozinha. */
const DONE_MS = 2500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Resolve com o valor, "network" se a chamada falhar ou "timeout" se passar do prazo. */
const settle = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([
    p.then(
      (v) => ({ v }),
      () => "network" as const,
    ),
    sleep(ms).then(() => "timeout" as const),
  ]);

/** Faz o horário recém-criado piscar na linha do dia (se o dia estiver na tela). */
function flash(id: string) {
  requestAnimationFrame(() =>
    document.querySelector(`[data-appointment="${CSS.escape(id)}"]`)?.classList.add("appt-new"),
  );
}

export function NewAppointmentSheet({
  date,
  clients,
  services,
  openKey,
  time,
  clientId,
  serviceIds,
  fromBlockId,
  onClosed,
}: {
  date: string;
  /** null enquanto as opções chegam (a folha do "Novo" do nav busca na hora de abrir). */
  clients: PickerOption[] | null;
  services: ServiceOption[] | null;
  /** Aberta pelo "Novo" do nav: sem botão próprio, e cada valor novo abre a folha. */
  openKey?: number;
  /** Horário já escolhido (toque num vazio da linha do dia). */
  time?: string;
  /** Cliente já escolhida (deslizar a linha em Clientes). */
  clientId?: string;
  /** Serviços já escolhidos (toque num horário em Vagas). */
  serviceIds?: string[];
  /** Evento de fora (iPhone/Google) que vira este atendimento: sai da agenda quando salvar. */
  fromBlockId?: string;
  /** Avisa quando a folha fecha, para a agenda tirar o bloco provisório. */
  onClosed?: () => void;
}) {
  const [open, setOpen] = useState(false);
  /** null = formulário; senão, a Bolha trabalhando ou o resultado por cima de tudo. */
  const [booking, setBooking] = useState<Booking | null>(null);
  const [fieldErr, setFieldErr] = useState<{ code: ErrorCode; field?: string } | null>(null);
  /** Troca a cada agendamento salvo, para a próxima folha começar vazia. */
  const [formKey, setFormKey] = useState(0);
  const runId = useRef(0);
  const lastData = useRef<FormData | null>(null);
  const [prevKey, setPrevKey] = useState(openKey);
  if (openKey !== prevKey) {
    setPrevKey(openKey);
    setOpen(true);
    setBooking(null);
  }
  const loading = clients === null || services === null;
  const missing = !loading && (clients.length === 0 || services.length === 0);
  const working = booking !== null && booking.result === null;
  const times = timeOptions({ include: time });
  const closedRef = useRef(onClosed);
  useEffect(() => {
    closedRef.current = onClosed;
  });
  useEffect(() => {
    if (!open) closedRef.current?.();
  }, [open]);

  async function book(fd: FormData) {
    const id = ++runId.current;
    const alive = () => runId.current === id;
    const patch = (fn: (b: Booking) => Booking) => alive() && setBooking((b) => (b ? fn(b) : b));
    const steps = (s: Step[]) => patch((b) => ({ ...b, steps: s }));
    lastData.current = fd;
    setFieldErr(null);
    const client = clients?.find((c) => c.id === fd.get("clientId"))?.label ?? "";
    const service = fd
      .getAll("serviceIds")
      .map((id) => services?.find((s) => s.id === id)?.label)
      .filter(Boolean)
      .join(" + ");
    setBooking({
      steps: ["run", "wait", "wait"],
      slow: false,
      result: null,
      who: `${client} · ${formatDayTitle(String(fd.get("date")))} às ${fd.get("time")}`,
      service,
    });
    const started = Date.now();
    const slow = setTimeout(() => patch((b) => ({ ...b, slow: true })), SLOW_MS);
    const res = await settle(createAppointment(null, fd), GIVE_UP_MS);
    await sleep(MIN_MS - (Date.now() - started));
    clearTimeout(slow);
    if (!alive()) return;

    const r = typeof res === "string" ? null : res.v;
    if (!r || !r.ok) {
      if (r?.code === "VALIDATION") {
        setFieldErr({ code: r.code, field: r.field });
        setBooking(null);
        return;
      }
      const code = r ? r.code : res === "timeout" ? "TIMEOUT" : "NETWORK";
      steps(["fail", "wait", "wait"]);
      patch((b) => ({ ...b, result: { kind: "error", code } }));
      return;
    }

    const created = r.data;
    warnSync(created.sync);
    steps(["done", "wait", "wait"]);
    await sleep(200);
    steps(["done", "done", "run"]);
    // Mensagem de agendamento já saiu: o WhatsApp está de pé, não precisa consultar
    const wa = created.message === "sent" ? null : await settle(whatsappStatus(), 8000);
    const reminder = !wa
      ? "ok"
      : typeof wa === "string" || !wa.v.ok
        ? "unavailable"
        : wa.v.data.state === "open"
          ? created.message === "failed"
            ? "unavailable"
            : "ok"
          : "off";
    steps(["done", "done", reminder === "ok" ? "done" : "warn"]);
    patch((b) => ({
      ...b,
      result: reminder === "ok" ? { kind: "ok", id: created.id } : { kind: "warn", id: created.id, reason: reminder },
    }));
  }

  function finish(id: string) {
    runId.current++;
    setOpen(false);
    setBooking(null);
    setFormKey((k) => k + 1);
    flash(id);
  }

  const done = booking?.result?.kind === "ok" ? booking.result.id : null;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => finish(done), DONE_MS);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <Drawer.Root
      repositionInputs={false}
      open={open}
      dismissible={!working}
      onOpenChange={(next) => {
        // Enquanto salva, arrastar para baixo não pode largar o pedido no meio
        if (!next && working) return;
        if (!next && booking?.result && booking.result.kind !== "error") return finish(booking.result.id);
        runId.current++;
        setOpen(next);
        setBooking(null);
      }}
    >
      {openKey === undefined ? (
        <Drawer.Trigger className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold">
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
            <path d="M8 3v3.5M16 3v3.5M12 10.5v6M9 13.5h6" />
          </svg>
          Agendar
        </Drawer.Trigger>
      ) : null}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={
            booking
              ? "booking-ov fixed inset-0 z-50 overflow-y-auto outline-none"
              : "sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
          }
        >
          <div hidden={booking !== null}>
            <Drawer.Title className="pb-1 text-xl font-bold">Novo agendamento</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              {missing
                ? "Cadastre ao menos uma cliente (em Clientes) e um serviço (em Serviços)."
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
            ) : missing ? null : (
              // Fica montado por trás da Bolha: se der erro, a folha volta preenchida
              <form
                key={`${formKey}-${date}-${time ?? ""}-${clientId ?? ""}-${serviceIds?.join(",") ?? ""}-${fromBlockId ?? ""}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!working) void book(new FormData(e.currentTarget));
                }}
                className="grid gap-3"
              >
                {fromBlockId ? <input type="hidden" name="fromBlockId" value={fromBlockId} /> : null}
                <LetterPicker
                  name="clientId"
                  label="Cliente"
                  placeholder="Escolha a cliente…"
                  options={clients}
                  defaultId={clientId}
                />
                <BookingServices
                  services={services}
                  defaultIds={serviceIds}
                  discountError={fieldErr?.field === "discountValue"}
                />
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
                    defaultValue={time ?? "09:00"}
                    aria-invalid={fieldErr?.field === "time"}
                  >
                    {times.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                {fieldErr && fieldErr.field !== "discountValue" ? (
                  <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                    {messageFor(fieldErr.code)}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={working}
                  className="btn-tint mt-1 flex min-h-13 items-center justify-center rounded-full px-5 font-bold"
                >
                  Agendar
                </button>
              </form>
            )}
          </div>
          {booking ? (
            <BookingOverlay
              booking={booking}
              onDone={finish}
              onRetry={() => lastData.current && void book(lastData.current)}
              onPickAnother={() => {
                setBooking(null);
                setFieldErr({ code: "SLOT_TAKEN", field: "time" });
              }}
              onClose={() => {
                runId.current++;
                setOpen(false);
                setBooking(null);
              }}
            />
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
