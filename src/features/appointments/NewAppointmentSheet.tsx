"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import type { PickerOption } from "@/components/ui/LetterPicker";
import { Icon } from "@/components/ui/Icon";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { formatBRL, formatDayTitle } from "@/lib/dates";
import { notify } from "@/components/feedback/toast";
import type { Day } from "@/features/hours/slots";
import type { ErrorCode } from "@/lib/errors";
import { whatsappStatus } from "@/features/whatsapp/actions";
import { DEFAULT_POLICY } from "@/features/wallet/rules";
import { BookingOverlay, type Booking, type Step } from "./BookingOverlay";
import { BookingSteps } from "./BookingSteps";
import type { ServiceOption } from "./options";
import { warnSync } from "./sync-warning";
import { createAppointment, loadBookingOptions } from "./actions";

/** Só carrega quando a dona toca em "Criar serviço" (caso raro): não pesa na folha de agendar. */
const ServiceForm = dynamic(() => import("@/features/services/ServiceForm").then((m) => m.ServiceForm), {
  loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
});

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
  services: servicesProp,
  openKey,
  time,
  timeTapped = true,
  clientId,
  serviceIds,
  fromBlockId,
  week,
  depositPct,
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
  /** false = o horário é só sugestão (botão Agendar): o passo "Quando?" aparece com ele marcado. */
  timeTapped?: boolean;
  /** Cliente já escolhida (deslizar a linha em Clientes). */
  clientId?: string;
  /** Serviços já escolhidos (toque num horário em Vagas). */
  serviceIds?: string[];
  /** Evento de fora (iPhone/Google) que vira este atendimento: sai da agenda quando salvar. */
  fromBlockId?: string;
  /** Expediente da semana (0 = domingo); com ele a folha avisa quando o horário cai fora (pode agendar mesmo assim). */
  week?: Day[] | null;
  /** Sinal sugerido (% do total), de Ajustes > Pagamentos. */
  depositPct?: number;
  /** Avisa quando a folha fecha, para a agenda tirar o bloco provisório. */
  onClosed?: () => void;
}) {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  /** null = formulário; senão, a Bolha trabalhando ou o resultado por cima de tudo. */
  const [booking, setBooking] = useState<Booking | null>(null);
  const [fieldErr, setFieldErr] = useState<{ code: ErrorCode; field?: string } | null>(null);
  /** Troca a cada agendamento salvo, para a próxima folha começar vazia. */
  const [formKey, setFormKey] = useState(0);
  const runId = useRef(0);
  const lastData = useRef<FormData | null>(null);
  /** Serviços recarregados depois de criar o primeiro aqui mesmo (a lista que veio estava vazia). */
  const [fresh, setFresh] = useState<ServiceOption[] | null>(null);
  /** Formulário de "Criar serviço" aberto dentro da folha, no lugar do aviso. */
  const [creating, setCreating] = useState(false);
  const [serviceKey, setServiceKey] = useState(0);
  const [reloading, setReloading] = useState(false);
  const [prevKey, setPrevKey] = useState(openKey);
  if (openKey !== prevKey) {
    setPrevKey(openKey);
    setOpen(true);
    setBooking(null);
    setFresh(null);
    setCreating(false);
  }
  const services = fresh && fresh.length > 0 ? fresh : servicesProp;
  const loading = clients === null || services === null;
  const missing = !loading && (clients.length === 0 || services.length === 0);
  const noServices = !loading && services.length === 0;
  const noClients = !loading && clients.length === 0;

  /** Serviço criado aqui: busca a lista de novo e, se já dá para agendar, a folha vira o agendar. */
  async function reloadServices() {
    setReloading(true);
    const res = await loadBookingOptions();
    setReloading(false);
    if (!res.ok) {
      notify.error(res.code, () => void reloadServices());
      return;
    }
    setFresh(res.data.services);
    setCreating(false);
    if (res.data.services.length === 0)
      notify.info("Serviço fora do agendar", "Ligue \"Disponível para agendar\" no serviço para escolher aqui.");
  }
  // O botão Agendar fica fora do <form> (no rodapé fixo) e aponta para ele pelo id
  const formDomId = useId();
  const working = booking !== null && booking.result === null;
  const formId = `${openKey ?? ""}-${formKey}-${date}-${time ?? ""}-${clientId ?? ""}-${serviceIds?.join(",") ?? ""}-${fromBlockId ?? ""}`;
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
    if (created.session)
      notify.success(
        `Usou 1 sessão do pacote ${created.session.name}. Restam ${created.session.left} de ${created.session.total}`,
      );
    if (created.credit > 0) notify.success(`Usou ${formatBRL(created.credit)} do crédito da cliente`);
    if (created.promotion)
      notify.success(
        `Promoção ${created.promotion.name ?? ""} aplicada: −${formatBRL(created.promotion.offCents)}`.replace(
          "  ",
          " ",
        ),
        created.promotion.maxClients !== null
          ? `${created.promotion.used} de ${created.promotion.maxClients} clientes já usaram.`
          : undefined,
      );
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
      direction={side}
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
              : sheetClass(
                  side,
                  // altura fixa: a folha não pula de tamanho a cada passo
                  "fixed inset-x-0 bottom-0 mx-auto h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl outline-none",
                  // no desktop o painel ganha a coluna do resumo
                  "sheet z-50 flex flex-col md:w-[min(720px,100vw)]!",
                )
          }
        >
          {booking ? null : <SidePanelClose />}
          {/* Passos curtos, uma pergunta por vez; o botão de cada passo fica fixo no rodapé, sempre à vista */}
          <div hidden={booking !== null} className="flex min-h-0 flex-1 flex-col">
            <Drawer.Title className="sr-only">Novo agendamento</Drawer.Title>
            <Drawer.Description className="sr-only">
              {missing
                ? "Cadastre ao menos uma cliente (em Clientes) e um serviço (em Serviços)."
                : "Para quem, qual serviço, quando e conferir."}
            </Drawer.Description>
            {loading ? (
              <div className="px-5 pt-6 pb-[max(env(safe-area-inset-bottom),20px)] md:px-0">
                <LoadingRegion label="Carregando clientes e serviços">
                  <div className="grid gap-3">
                    <Skeleton className="h-8 w-40 rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-13 w-full rounded-2xl" />
                    <Skeleton className="h-13 w-full rounded-2xl" />
                  </div>
                </LoadingRegion>
              </div>
            ) : missing && creating && noServices ? (
              // Cria o serviço aqui mesmo, sem sair do agendar; ao salvar volta para o agendar já com ele
              <div className={`${SHEET_SCROLL} pt-6`}>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary"
                >
                  <span aria-hidden="true">‹</span>
                  Voltar
                </button>
                <p className="text-xl font-bold">Novo serviço</p>
                <p className="pb-4 pt-1 text-sm font-semibold text-muted">
                  Preencha nome, duração e preço. Depois é só escolher no agendar.
                </p>
                {reloading ? (
                  <LoadingRegion label="Atualizando serviços">
                    <div className="grid gap-3">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                      <Skeleton className="h-13 w-full rounded-2xl" />
                    </div>
                  </LoadingRegion>
                ) : (
                  <ServiceForm
                    key={serviceKey}
                    services={[]}
                    onSaved={() => void reloadServices()}
                    onDuplicate={() => undefined}
                    onDelete={() => undefined}
                  />
                )}
              </div>
            ) : missing ? (
              <div className="px-5 pt-6 pb-[max(env(safe-area-inset-bottom),20px)] md:px-0">
                <p className="text-xl font-bold">Novo agendamento</p>
                <p className="pt-1 text-sm font-semibold text-muted">
                  {noServices && noClients
                    ? "Para agendar, cadastre ao menos um serviço e uma cliente (em Clientes)."
                    : noServices
                      ? "Para agendar, cadastre ao menos um serviço."
                      : "Cadastre ao menos uma cliente (em Clientes)."}
                </p>
                {noServices ? (
                  <button
                    type="button"
                    onClick={() => {
                      setServiceKey((k) => k + 1);
                      setCreating(true);
                    }}
                    className="btn-tint mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-bold"
                  >
                    <Icon name="plus" size={18} />
                    Criar serviço
                  </button>
                ) : null}
              </div>
            ) : (
              // Fica montado por trás da Bolha: se der erro, a folha volta preenchida
              <BookingSteps
                key={formId}
                formDomId={formDomId}
                clients={clients}
                services={services}
                date={date}
                time={time}
                timeTapped={timeTapped}
                clientId={clientId}
                serviceIds={serviceIds}
                fromBlockId={fromBlockId}
                week={week}
                depositPct={depositPct ?? DEFAULT_POLICY.depositPct}
                working={working}
                fieldErr={fieldErr}
                onSubmit={(fd) => void book(fd)}
              />
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
