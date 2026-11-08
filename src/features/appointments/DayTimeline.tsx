"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { BlockCard } from "@/features/blocks/BlockCard";
import { AppointmentCard } from "./AppointmentCard";
import type { Status } from "./schema";
import { duration, hhmm, type Span } from "./timeline";

/** Altura de uma hora na linha do dia; 30 min = 48 px, o bastante para duas linhas no card. */
const HOUR_PX = 96;

export type TimelineAppointment = Span & {
  kind: "appointment";
  id: string;
  clientId: string;
  clientName: string;
  /** Já formatado para exibir. */
  clientPhone: string;
  serviceName: string;
  price: string;
  status: Status;
};
export type TimelineBlock = Span & { kind: "block"; id: string; reason: string | null };

const CHIP: Record<Status, { label: string; className: string }> = {
  pending_confirmation: { label: "Aguardando", className: "bg-wait-bg text-wait" },
  confirmed: { label: "Confirmado", className: "bg-ok-bg text-ok" },
  done: { label: "Concluído", className: "bg-soft text-muted" },
  no_show: { label: "Faltou", className: "bg-fail-bg text-fail" },
  cancelled: { label: "Cancelado", className: "bg-soft text-muted" },
};

/** Linha do dia da prancha: grade de horas cheias e blocos com altura proporcional à duração. */
export function DayTimeline({
  date,
  window,
  events,
  free,
  nowMin,
}: {
  date: string;
  window: Span;
  events: (TimelineAppointment | TimelineBlock)[];
  free: Span[];
  /** Só no dia de hoje: posição da linha "agora". */
  nowMin: number | null;
}) {
  const y = (m: number) => ((m - window.start) / 60) * HOUR_PX;
  const box = (s: Span) => ({ top: y(s.start) + 2, height: Math.max(y(s.end) - y(s.start) - 4, 32) });
  const hours = Array.from({ length: (window.end - window.start) / 60 + 1 }, (_, i) => window.start + i * 60);

  return (
    <section aria-label="Linha do dia" className="relative mb-6" style={{ height: y(window.end) + 8 }}>
      {hours.map((h) => (
        // A linha começa depois do rótulo: sem fundo atrás da hora, ela não risca o texto
        <div key={h} className="absolute inset-x-0" style={{ top: y(h) }} aria-hidden="true">
          <span className="absolute -top-2 left-0 text-[11px] font-semibold tabular-nums text-muted">{hhmm(h)}</span>
          <span className="absolute left-11 right-0 top-0 border-t border-dashed border-line" />
        </div>
      ))}

      {free.map((g) => (
        <Link
          key={g.start}
          href="/vagas"
          className="absolute left-14 right-0 flex items-center justify-between gap-2 rounded-2xl px-3 outline-1 -outline-offset-1 outline-dashed outline-primary"
          style={box(g)}
        >
          <b className="truncate text-sm text-primary-text">
            Livre · {hhmm(g.start)}–{hhmm(g.end)}
          </b>
          {g.end - g.start >= 45 ? (
            <span className="btn-tint shrink-0 rounded-full px-3 py-1 text-xs font-bold">Divulgar vaga</span>
          ) : null}
        </Link>
      ))}

      {events.map((e) => (
        <EventBlock key={e.id} event={e} date={date} style={box(e)} />
      ))}

      {nowMin !== null && nowMin >= window.start && nowMin <= window.end ? (
        <div className="pointer-events-none absolute left-12 right-0 z-10 h-0.5 bg-accent" style={{ top: y(nowMin) }} aria-label={`Agora, ${hhmm(nowMin)}`}>
          <span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-accent" />
        </div>
      ) : null}
    </section>
  );
}

/** Toque no bloco abre a folha com as ações (confirmar, concluir, cancelar, remover pausa). */
function EventBlock({ event, date, style }: { event: TimelineAppointment | TimelineBlock; date: string; style: { top: number; height: number } }) {
  const [open, setOpen] = useState(false);
  const time = `${hhmm(event.start)}–${hhmm(event.end)}`;
  const tall = style.height >= 60;

  let face: ReactNode;
  let detail: ReactNode;
  if (event.kind === "appointment") {
    const chip = CHIP[event.status];
    // Cabe tanto quanto a altura deixa: 15 min = uma linha; 30 min = duas; 45 min ou mais = três
    const lines = style.height >= 64 ? 3 : style.height >= 40 ? 2 : 1;
    const when = `${time} · ${duration(event)}`;
    const price = <span className="shrink-0 text-xs font-bold tabular-nums text-primary-text">{event.price}</span>;
    face = (
      <>
        <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-primary" aria-hidden="true" />
        <span className="flex items-center justify-between gap-2">
          <b className="truncate text-sm leading-5">{event.clientName}</b>
          {lines > 1 ? (
            <span className={`shrink-0 rounded-full px-2 text-[11px] font-bold leading-[18px] ${chip.className}`}>{chip.label}</span>
          ) : (
            <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted">{hhmm(event.start)}</span>
          )}
        </span>
        {lines === 2 ? (
          <span className="flex items-center justify-between gap-2 text-xs font-semibold leading-4">
            <span className="truncate text-muted">
              {event.serviceName} · <span className="tabular-nums">{when}</span>
            </span>
            {price}
          </span>
        ) : null}
        {lines === 3 ? (
          <>
            <span className="truncate text-xs font-semibold leading-4 text-muted">{event.serviceName}</span>
            <span className="flex items-center justify-between gap-2 text-xs font-semibold leading-4">
              <span className="truncate tabular-nums text-muted">{when}</span>
              {price}
            </span>
          </>
        ) : null}
      </>
    );
    detail = (
      <AppointmentCard
        inSheet
        id={event.id}
        time={hhmm(event.start)}
        clientId={event.clientId}
        clientName={event.clientName}
        clientPhone={event.clientPhone}
        serviceName={event.serviceName}
        price={event.price}
        status={event.status}
      />
    );
  } else {
    face = (
      <>
        <b className="truncate text-sm font-semibold text-muted">Bloqueado{event.reason ? ` · ${event.reason}` : ""}</b>
        {tall ? <span className="text-[11px] font-bold tabular-nums text-muted">{time}</span> : null}
      </>
    );
    detail = <BlockCard id={event.id} date={date} start={hhmm(event.start)} end={hhmm(event.end)} reason={event.reason} />;
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        className={`absolute left-14 right-0 flex flex-col justify-center gap-0.5 overflow-hidden rounded-2xl px-3 text-left transition-transform active:scale-[0.98] ${
          event.kind === "appointment" ? "glass" : "timeline-pause"
        }`}
        style={style}
        data-appointment={event.kind === "appointment" ? event.id : undefined}
      >
        {face}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pb-1 text-xl font-bold">{event.kind === "appointment" ? event.clientName : "Horário bloqueado"}</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">{time}</Drawer.Description>
          <ul className="grid gap-2">{detail}</ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
