"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import type { PickerOption } from "@/components/ui/LetterPicker";
import { BlockCard } from "@/features/blocks/BlockCard";
import { formatDayTitle, formatShortDate } from "@/lib/dates";
import { AppointmentCard } from "./AppointmentCard";
import { rescheduleAppointment } from "./actions";
import {
  conflictReason,
  dragSpan,
  layoutColumns,
  nextFree,
  SNAP_MIN,
  type DragMode,
  type Occupant,
} from "./agenda-grid";
import { NewAppointmentSheet } from "./NewAppointmentSheet";
import type { Status } from "./schema";
import { warnSync } from "./sync-warning";
import { duration, hhmm, type Span } from "./timeline";
import type { ServiceOption } from "./options";

const HOUR_PX = 80;
const PPM = HOUR_PX / 60;
/** Coluna das horas à esquerda e o respiro entre blocos lado a lado. */
const LEFT = 48;
const GAP = 3;
const HOLD_MS = 400;
const HOLD_REDUCED_MS = 250;
/** Mexer mais que isso antes do tempo de segurar é rolagem, não arraste. */
const TOLERANCE_PX = 8;
/** Setas do teclado: espera a pessoa parar de apertar antes de salvar. */
const KEY_SAVE_MS = 600;
/** Bloco provisório do toque no vazio e do "Agendar". */
const NEW_LEN = 60;

export type AgendaAppointment = Span & {
  kind: "appointment";
  id: string;
  clientId: string;
  clientName: string;
  /** Já formatado para exibir. */
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  price: string;
  status: Status;
  /** Uma das 5 cores, pelo serviço. */
  tone: number;
};
export type AgendaBlock = Span & { kind: "block"; id: string; reason: string | null; external?: boolean };

type Gesture = {
  id: string;
  mode: DragMode;
  from: Span;
  span: Span;
  bad: string | null;
  x0: number;
  y0: number;
  cy: number;
  scroll0: number;
  pid: number;
  el: HTMLElement;
  timer?: ReturnType<typeof setTimeout>;
  active: boolean;
};

const STATUS_SHORT: Record<Status, string> = {
  pending_confirmation: "aguardando",
  confirmed: "confirmado",
  cancelled: "cancelado",
  done: "concluído",
  no_show: "faltou",
  reschedule_requested: "quer remarcar",
};
const canDrag = (s: Status) => s === "pending_confirmation" || s === "confirmed" || s === "reschedule_requested";
const firstName = (n: string) => n.trim().split(/\s+/)[0];
const range = (s: Span) => `${hhmm(s.start)}–${hhmm(s.end)}`;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const TIP_KEY = "mimo:dica-arrastar";
const TIP_TIMES = 3;
/** A dica de arrastar aparece nas 3 primeiras vezes que um atendimento é aberto neste aparelho. */
function takeTip(): boolean {
  try {
    const n = Number(localStorage.getItem(TIP_KEY) ?? 0);
    if (n >= TIP_TIMES) return false;
    localStorage.setItem(TIP_KEY, String(n + 1));
    return true;
  } catch {
    return false;
  }
}

// Último dia mostrado, para o dia novo entrar deslizando do lado certo
let lastDate: string | null = null;

/**
 * Linha do dia como no Calendário do iPhone: segurar levanta o atendimento e arrastar encaixa
 * de 15 em 15 min; as bolinhas mudam começo e duração; tocar no vazio abre o novo agendamento.
 */
export function AgendaDay({
  date,
  win,
  hours,
  pause = null,
  appointments,
  blocks,
  nowMin,
  clients,
  services,
  blockButton,
}: {
  date: string;
  /** Janela da grade, 08–20 esticada se preciso. */
  win: Span;
  /** Expediente; null = salão fechado. */
  hours: Span | null;
  /** Pausa fixa do expediente (ex.: almoço): faixa sem toque, que o arraste evita. */
  pause?: Span | null;
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  /** Só no dia de hoje: posição da linha da hora atual. */
  nowMin: number | null;
  clients: PickerOption[];
  services: ServiceOption[];
  blockButton: ReactNode;
}) {
  // Horário otimista depois do arraste, até o servidor mandar a agenda nova
  const [moved, setMoved] = useState<Record<string, Span>>({});
  const [prevAppointments, setPrevAppointments] = useState(appointments);
  if (prevAppointments !== appointments) {
    setPrevAppointments(appointments);
    setMoved({});
  }
  const [selId, setSelId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; span: Span; from: Span; bad: string | null } | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [temp, setTemp] = useState<Span | null>(null);
  const [newKey, setNewKey] = useState(0);
  const [enter] = useState(() =>
    lastDate === null || lastDate === date ? undefined : date > lastDate ? "fwd" : "back",
  );

  const appts = appointments.map((a) => (moved[a.id] ? { ...a, ...moved[a.id] } : a));
  const occupants: Occupant[] = [
    ...appts.map((a) => ({ id: a.id, kind: "appointment" as const, label: a.clientName, start: a.start, end: a.end })),
    ...blocks.map((b) => ({ id: b.id, kind: "block" as const, label: b.reason ?? "", start: b.start, end: b.end })),
    ...(pause ? [{ id: "pausa", kind: "block" as const, label: "Pausa", ...pause }] : []),
  ];
  const lay = layoutColumns([...occupants, ...(temp ? [{ id: "temp", ...temp }] : [])]);

  const detailAppt = appts.find((a) => a.id === detailId);
  const detailBlock = blocks.find((b) => b.id === detailId);
  // Cancelou ou removeu: o bloco sumiu da agenda, a folha fecha junto
  if (detailId && !detailAppt && !detailBlock) setDetailId(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClickUntil = useRef(0);
  const keyMove = useRef<{ id: string; from: Span; span: Span; timer: ReturnType<typeof setTimeout> } | null>(null);
  // O que os ouvintes da janela precisam ler da renderização mais recente
  const live = useRef({ win, hours, occupants });
  useEffect(() => {
    live.current = { win, hours, occupants };
  });

  const y = (m: number) => (m - win.start) * PPM;
  const place = (s: Span, id: string) => {
    const { col, cols } = lay.get(id) ?? { col: 0, cols: 1 };
    return {
      top: y(s.start),
      height: Math.max((s.end - s.start) * PPM - GAP, 18),
      left: `calc(${LEFT}px + (100% - ${LEFT}px) * ${col} / ${cols})`,
      width: `calc((100% - ${LEFT}px) / ${cols} - ${GAP}px)`,
    };
  };

  async function save(id: string, span: Span, from: Span, mode: DragMode, isUndo = false) {
    setMoved((m) => ({ ...m, [id]: span }));
    const name = firstName(appointments.find((a) => a.id === id)?.clientName ?? "");
    const res = await rescheduleAppointment(id, date, hhmm(span.start), span.end - span.start).catch(() => null);
    if (!res || !res.ok) {
      setMoved((m) => ({ ...m, [id]: from }));
      notify.error(res ? res.code : "NETWORK");
      return;
    }
    warnSync(res.data.sync);
    if (isUndo) return notify.success(`${name} voltou para ${hhmm(span.start)}`);
    notify.undoable(
      mode === "move" ? `${name} foi para ${hhmm(span.start)}` : `${name}: ${range(span)}`,
      () => void save(id, from, span, mode, true),
      "Lembrete do WhatsApp reprogramado",
    );
  }

  // Os ouvintes ficam na janela: o dedo pode sair do bloco durante o arraste
  const handlers = useRef<{ track: () => void; finish: (g: Gesture, cancelled: boolean) => void }>({
    track: () => {},
    finish: () => {},
  });
  useEffect(() => {
    handlers.current.track = () => {
      const g = gesture.current;
      if (!g?.active) return;
      const { win, hours, occupants } = live.current;
      g.span = dragSpan(g.mode, g.from, (g.cy - g.y0 + window.scrollY - g.scroll0) / PPM, win);
      g.bad = conflictReason({ id: g.id, ...g.span }, hours, occupants);
      setDrag({ id: g.id, span: g.span, from: g.from, bad: g.bad });
    };
    handlers.current.finish = (g, cancelled) => {
      clearTimeout(g.timer);
      g.el.classList.remove("pressing");
      gesture.current = null;
      if (!g.active) return; // toque rápido: o onClick abre o detalhe
      suppressClickUntil.current = Date.now() + 400;
      setDrag(null);
      setSelId(g.id);
      if (cancelled) return;
      if (g.bad) {
        setShakeId(g.id);
        setTimeout(() => setShakeId(null), 400);
        notify.problem("Não deu para mudar", `${g.bad}. Voltou para o horário de antes.`);
        return;
      }
      if (g.span.start === g.from.start && g.span.end === g.from.end) return;
      void save(g.id, g.span, g.from, g.mode);
    };
  });

  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pid) return;
      if (!g.active) {
        if (Math.abs(e.clientX - g.x0) > TOLERANCE_PX || Math.abs(e.clientY - g.y0) > TOLERANCE_PX) {
          clearTimeout(g.timer);
          g.el.classList.remove("pressing");
          gesture.current = null;
        }
        return;
      }
      e.preventDefault();
      g.cy = e.clientY;
      handlers.current.track();
    };
    const up = (e: globalThis.PointerEvent) => {
      const g = gesture.current;
      if (g && e.pointerId === g.pid) handlers.current.finish(g, e.type === "pointercancel");
    };
    // iOS: sem isso a página rola junto com o bloco
    const touch = (e: TouchEvent) => {
      if (gesture.current?.active) e.preventDefault();
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.addEventListener("touchmove", touch, { passive: false });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.removeEventListener("touchmove", touch);
    };
  }, []);

  // Ao abrir, desce até o que importa: em hoje, o próximo atendimento (ou a hora atual);
  // nos outros dias, o primeiro atendimento. Deixa 1 hora de respiro acima e não mexe se a pessoa já rolou.
  useEffect(() => {
    lastDate = date;
    const grid = gridRef.current;
    if (!grid || window.scrollY > 40) return;
    const starts = appointments
      .filter((a) => a.status !== "cancelled")
      .map((a) => a.start)
      .sort((a, b) => a - b);
    const target = nowMin !== null ? (starts.find((s) => s >= nowMin - 30) ?? nowMin) : starts[0];
    if (target === undefined) return;
    const top = grid.getBoundingClientRect().top + window.scrollY + y(Math.max(win.start, target - 60)) - 120;
    if (top > window.scrollY + 40) window.scrollTo({ top, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir o dia
  }, []);

  function activate(g: Gesture) {
    g.active = true;
    g.el.classList.remove("pressing");
    try {
      g.el.setPointerCapture(g.pid);
    } catch {
      // o ponteiro já foi solto
    }
    navigator.vibrate?.(8);
    setSelId(null);
    setDrag({ id: g.id, span: g.from, from: g.from, bad: null });
    const scroll = () => {
      if (gesture.current !== g) return;
      // Perto do topo ou do fim da tela, a página rola sozinha
      const edge = g.cy < 120 ? g.cy - 120 : g.cy > window.innerHeight - 140 ? g.cy - (window.innerHeight - 140) : 0;
      if (edge) {
        window.scrollBy(0, edge / 5);
        handlers.current.track();
      }
      requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
  }

  function press(e: PointerEvent<HTMLButtonElement>, a: AgendaAppointment) {
    if (e.button !== 0 || gesture.current || !canDrag(a.status)) return;
    const h = (e.target as HTMLElement).closest("[data-h]")?.getAttribute("data-h");
    const mode: DragMode = h === "t" ? "top" : h === "b" ? "bottom" : "move";
    const from = { start: a.start, end: a.end };
    const g: Gesture = {
      id: a.id,
      mode,
      from,
      span: from,
      bad: null,
      x0: e.clientX,
      y0: e.clientY,
      cy: e.clientY,
      scroll0: window.scrollY,
      pid: e.pointerId,
      el: e.currentTarget,
      active: false,
    };
    gesture.current = g;
    if (mode !== "move") {
      // Bolinha do bloco já selecionado: puxa na hora, sem esperar
      e.preventDefault();
      activate(g);
      return;
    }
    g.el.classList.add("pressing");
    g.timer = setTimeout(() => gesture.current === g && activate(g), reducedMotion() ? HOLD_REDUCED_MS : HOLD_MS);
  }

  function nudge(e: KeyboardEvent<HTMLButtonElement>, a: AgendaAppointment) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    if (!canDrag(a.status)) return;
    const span = dragSpan("move", a, e.key === "ArrowUp" ? -SNAP_MIN : SNAP_MIN, win);
    const bad = conflictReason({ id: a.id, ...span }, hours, occupants);
    if (bad) return notify.problem("Não dá para mover", bad);
    const k = keyMove.current;
    if (k) clearTimeout(k.timer);
    const from = k?.id === a.id ? k.from : { start: a.start, end: a.end };
    if (k && k.id !== a.id) void save(k.id, k.span, k.from, "move");
    setMoved((m) => ({ ...m, [a.id]: span }));
    keyMove.current = {
      id: a.id,
      from,
      span,
      timer: setTimeout(() => {
        keyMove.current = null;
        void save(a.id, span, from, "move");
      }, KEY_SAVE_MS),
    };
  }

  function openNew(start: number | null) {
    setSelId(null);
    setTemp(start === null ? null : { start, end: start + NEW_LEN });
    setNewKey((k) => k + 1);
  }

  function tapEmpty(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest(".ag-ev")) return;
    setSelId(null);
    if (!hours) return notify.problem("Salão fechado nesse dia", "Para agendar mesmo assim, use o botão Agendar.");
    const tapped = win.start + (e.clientY - e.currentTarget.getBoundingClientRect().top) / PPM;
    const start = Math.max(win.start, Math.min(win.end - NEW_LEN, Math.floor(tapped / 30) * 30));
    const bad = conflictReason({ id: "temp", start, end: start + NEW_LEN }, hours, occupants);
    if (bad) return notify.problem("Esse horário está ocupado", bad);
    openNew(start);
  }

  const hourLines = Array.from({ length: (win.end - win.start) / 60 + 1 }, (_, i) => win.start + i * 60);
  const dayLabel = formatDayTitle(date);

  return (
    <>
      <div data-tour="money" className="mb-4 grid grid-cols-2 gap-2">
        {blockButton}
        <button
          type="button"
          onClick={() => openNew(nextFree(nowMin ?? 0, NEW_LEN, hours, occupants))}
          className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold"
        >
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
        </button>
      </div>

      <section aria-label="Linha do dia" className="ag-day mb-6" data-in={enter}>
        <div ref={gridRef} className="relative mt-2" style={{ height: y(win.end) + 8 }} onClick={tapEmpty}>
          {hourLines.map((h) => (
            <div key={h} aria-hidden="true">
              <div className="ag-hl" style={{ top: y(h) }}>
                <b>{hhmm(h)}</b>
              </div>
              {h < win.end ? <div className="ag-hl half" style={{ top: y(h) + HOUR_PX / 2 }} /> : null}
            </div>
          ))}
          {hours ? null : <div className="ag-closed">Salão fechado</div>}
          {pause && hours ? (
            <div className="ag-ev pause fixed-pause" style={place(pause, "pausa")} aria-label={`Pausa, ${range(pause)}`} role="img">
              <b>Pausa</b>
              <span className="tm">{range(pause)}</span>
            </div>
          ) : null}

          {blocks.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`ag-ev pause ${b.external ? "ext" : ""} ${b.end - b.start < 40 ? "short" : ""}`}
              style={place(b, b.id)}
              onClick={() => setDetailId(b.id)}
              aria-label={`${b.external ? "Google Agenda" : "Bloqueado"}${b.reason ? ` · ${b.reason}` : ""}, ${range(b)}`}
            >
              <b>{b.reason ?? "Bloqueado"}</b>
              <span className="tm">{range(b)}</span>
            </button>
          ))}

          {drag ? <div className="ag-ghost" style={place(drag.from, drag.id)} /> : null}

          {appts.map((a) => {
            const dragging = drag && drag.id === a.id ? drag : null;
            const lifted = dragging !== null;
            const span = dragging ? dragging.span : a;
            const box = place(span, a.id);
            const sel = selId === a.id;
            const cls = [
              "ag-ev",
              span.end - span.start < 45 ? "tight" : "",
              sel && !lifted ? "sel" : "",
              lifted ? "lift" : "",
              dragging?.bad ? "bad" : "",
              shakeId === a.id ? "shake" : "",
            ].join(" ");
            return (
              <button
                key={a.id}
                type="button"
                className={cls}
                style={box}
                data-tone={a.tone}
                data-status={a.status}
                data-appointment={a.id}
                onPointerDown={(e) => press(e, a)}
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => nudge(e, a)}
                onClick={() => {
                  if (Date.now() < suppressClickUntil.current) return;
                  setSelId(a.id);
                  setDetailId(a.id);
                  setShowTip(canDrag(a.status) && takeTip());
                }}
                aria-label={`${a.clientName}, ${a.serviceName}, ${hhmm(span.start)} a ${hhmm(span.end)}${canDrag(a.status) ? ". Segure para mover." : ""}`}
              >
                {(sel || lifted) && canDrag(a.status) ? (
                  <span className="ag-hd t" data-h="t" aria-hidden="true" />
                ) : null}
                {/* Cabe o quanto a altura deixa: 30 min nome, valor, horário e serviço; 45 min a data; 90 min telefone e situação */}
                <span className="row">
                  <b>{a.clientName}</b>
                  <i>{a.price}</i>
                </span>
                <span className="tm">
                  {range(span)} · {a.serviceName}
                </span>
                {span.end - span.start >= 45 ? (
                  <span className="sub">
                    {formatShortDate(date)} · {duration(span)}
                    {span.end - span.start >= 90 ? ` · ${a.clientPhone} · ${STATUS_SHORT[a.status]}` : ""}
                  </span>
                ) : null}
                {(sel || lifted) && canDrag(a.status) ? (
                  <span className="ag-hd b" data-h="b" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}

          {drag ? (
            <div className={`ag-tip ${drag.bad ? "bad" : ""}`} style={{ top: y(drag.span.start) }} aria-live="polite">
              {drag.bad ?? `${range(drag.span)} · ${duration(drag.span)}`}
            </div>
          ) : null}

          {temp ? (
            <div className="ag-ev temp" style={place(temp, "temp")} aria-hidden="true">
              <b>Novo agendamento</b>
              <span className="tm">{range(temp)}</span>
            </div>
          ) : null}

          {nowMin !== null && nowMin >= win.start && nowMin <= win.end ? (
            <div className="ag-now" style={{ top: y(nowMin) }} role="img" aria-label={`Agora, ${hhmm(nowMin)}`}>
              <b>{hhmm(nowMin)}</b>
            </div>
          ) : null}
        </div>
      </section>

      <NewAppointmentSheet
        date={date}
        clients={clients}
        services={services}
        openKey={newKey}
        time={temp ? hhmm(temp.start) : undefined}
        onClosed={() => setTemp(null)}
      />

      <Drawer.Root open={Boolean(detailAppt || detailBlock)} onOpenChange={(open) => !open && setDetailId(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
          <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
            <Drawer.Title className="pb-1 text-xl font-bold">
              {detailAppt
                ? detailAppt.clientName
                : detailBlock?.external
                  ? (detailBlock.reason ?? "Evento do Google")
                  : "Horário bloqueado"}
            </Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
              {detailAppt
                ? ` · ${range(detailAppt)} · ${duration(detailAppt)}`
                : detailBlock
                  ? ` · ${range(detailBlock)}`
                  : ""}
            </Drawer.Description>
            <ul className="grid gap-2">
              {detailAppt ? (
                <AppointmentCard
                  inSheet
                  id={detailAppt.id}
                  time={hhmm(detailAppt.start)}
                  date={date}
                  start={hhmm(detailAppt.start)}
                  clientId={detailAppt.clientId}
                  clientName={detailAppt.clientName}
                  clientPhone={detailAppt.clientPhone}
                  serviceId={detailAppt.serviceId}
                  serviceName={detailAppt.serviceName}
                  price={detailAppt.price}
                  status={detailAppt.status}
                  onSettled={() => setDetailId(null)}
                />
              ) : detailBlock?.external ? (
                <li className="glass rounded-2xl px-4 py-3">
                  <p className="font-bold">Evento do Google Agenda</p>
                  <p className="text-sm font-semibold text-muted">
                    Somente leitura. Para mudar ou apagar, use o Google Agenda.
                  </p>
                </li>
              ) : detailBlock ? (
                <BlockCard
                  id={detailBlock.id}
                  date={date}
                  start={hhmm(detailBlock.start)}
                  end={hhmm(detailBlock.end)}
                  reason={detailBlock.reason}
                />
              ) : null}
            </ul>
            {detailAppt && canDrag(detailAppt.status) && showTip ? (
              <p className="mt-3 rounded-2xl bg-soft px-4 py-3 text-sm font-semibold text-primary-text">
                Dica: na agenda, segure o atendimento e arraste para mudar o horário, ou puxe a bolinha de cima ou de
                baixo para mudar a duração.
              </p>
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
