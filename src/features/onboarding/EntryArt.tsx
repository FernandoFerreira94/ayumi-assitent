"use client";

import { Mascot } from "@/components/brand/Mascot";
import { Icon } from "@/components/ui/Icon";

/** Desenhos ilustrativos das telas de permissão (prévia do que a pessoa ganha). Os nomes são de exemplo. */

function Notice({ title, when, body, dim }: { title: string; when: string; body: string; dim?: boolean }) {
  return (
    <div className={`glass flex items-center gap-3 rounded-[1.5rem] px-4 py-3 ${dim ? "opacity-60" : ""}`}>
      <Mascot size={38} />
      <div className="min-w-0 flex-1">
        <p className="flex justify-between gap-2 text-sm font-bold">
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{title}</span>
          <span className="shrink-0 text-xs font-semibold text-muted">{when}</span>
        </p>
        <p className="text-[13px] font-semibold leading-snug text-muted">{body}</p>
      </div>
    </div>
  );
}

export function PushArt({ muted }: { muted?: boolean }) {
  return (
    <div className={`grid w-full gap-2.5 ${muted ? "opacity-50 grayscale" : ""}`} aria-hidden="true">
      <Notice dim title="Bom dia ☀️" when="7:00" body="Primeira cliente às 9h: Carla, design de sobrancelha." />
      <Notice title="Ana Paula confirmou" when="agora" body="Amanhã às 14h · Alongamento de cílios" />
      <Notice title="Novo pelo WhatsApp" when="2 min" body="Bia quer remarcar sexta, 10h. Toque para responder." />
    </div>
  );
}

export function CalendarArt({ muted }: { muted?: boolean }) {
  return (
    <div className={`grid w-full gap-3 ${muted ? "opacity-50 grayscale" : ""}`} aria-hidden="true">
      <div className="flex items-center justify-center gap-3">
        <span className="glass grid size-14 place-content-center rounded-[1.25rem]">
          <Mascot size={40} />
        </span>
        <span className="text-xl font-bold text-primary">⇄</span>
        <span className="glass grid size-14 place-content-center rounded-[1.25rem]">
          <Icon name="google" size={30} />
        </span>
      </div>
      <div className="glass grid gap-2 rounded-[1.75rem] p-4 text-sm font-bold">
        <p className="flex justify-between">
          Quinta, 20 <span className="text-xs font-semibold text-muted">Agenda</span>
        </p>
        <p className="rounded-xl bg-soft px-3 py-2 text-primary-text">
          09:00 · Carla · Sobrancelha <span className="block text-xs font-semibold opacity-70">Bubbly</span>
        </p>
        <p className="rounded-xl bg-line/60 px-3 py-2">
          11:00 · Dentista <span className="block text-xs font-semibold text-muted">Do Google · horário ocupado</span>
        </p>
        <p className="rounded-xl bg-soft px-3 py-2 text-primary-text">
          14:00 · Ana Paula · Cílios <span className="block text-xs font-semibold opacity-70">Bubbly</span>
        </p>
      </div>
    </div>
  );
}

export function WeatherArt({ muted }: { muted?: boolean }) {
  return (
    <div
      className={`glass grid w-full gap-3 rounded-[1.75rem] p-5 ${muted ? "opacity-50 grayscale" : ""}`}
      aria-hidden="true"
    >
      <div className="flex items-end gap-3">
        <Mascot size={84} weather="hot" />
        <p className="rounded-[1.25rem] bg-soft px-4 py-3 text-sm font-bold leading-snug text-primary-text">
          Calorão hoje! Já vesti os óculos. Amanhã é folga e não chove.
        </p>
      </div>
    </div>
  );
}
