"use client";

import { useState } from "react";
import { CHAT_BUTTON, ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
import { openReturnPrompt } from "./ReturnPrompt";

export type DueReturn = {
  appointmentId: string;
  clientId: string;
  name: string;
  /** já formatado para exibir */
  phone: string;
  service: string;
  /** "seg., 30 de nov." */
  dayLabel: string;
  /** dias de atraso (0 = vence hoje; negativo = ainda vai vencer) */
  lateDays: number;
};

const SHOWN = 4;

const when = (r: DueReturn) =>
  r.lateDays > 0
    ? `passou ${r.lateDays} ${r.lateDays === 1 ? "dia" : "dias"}`
    : r.lateDays === 0
      ? "vence hoje"
      : `retorno ${r.dayLabel}`;

/** Convite pronto no campo da conversa; a dona revisa e envia (nada sai sozinho). */
const invite = (r: DueReturn) => {
  const first = r.name.trim().split(/\s+/)[0];
  return `Oi, ${first}! Está chegando a hora do retorno (${r.service}). Quer que eu reserve um horário para você?`;
};

/** "Para chamar" em Clientes: retornos vencendo ou atrasados, de quem ainda não marcou. */
export function DueReturns({ items }: { items: DueReturn[] }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const list = all ? items : items.slice(0, SHOWN);
  const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-bold";
  return (
    <section aria-labelledby="para-chamar" className="glass mb-3 rounded-2xl px-4 py-3">
      <h2 id="para-chamar" className="flex items-baseline justify-between gap-2 pb-1">
        <span className="text-base font-bold">Para chamar</span>
        <span className="text-xs font-semibold text-muted">
          {items.length === 1 ? "1 retorno" : `${items.length} retornos`} sem horário
        </span>
      </h2>
      <ul className="divide-y divide-line">
        {list.map((r) => (
          <li key={r.appointmentId} className="flex items-center gap-2 py-2.5">
            <p className="min-w-0 flex-1">
              <span className="block truncate font-bold">{r.name}</span>
              <span className={`block truncate text-xs font-semibold ${r.lateDays > 0 ? "text-wait" : "text-muted"}`}>
                {r.service} · {when(r)}
              </span>
            </p>
            <ChatSheet
              clientId={r.clientId}
              clientName={r.name}
              phone={r.phone}
              initialText={invite(r)}
              triggerLabel={`Chamar ${r.name} no WhatsApp`}
              triggerClassName={`${btn} ${CHAT_BUTTON} w-11 px-0`}
            >
              <ChatGlyph />
            </ChatSheet>
            <button
              type="button"
              onClick={() => openReturnPrompt({ appointmentId: r.appointmentId })}
              aria-label={`Horários para o retorno de ${r.name}`}
              className={`${btn} btn-tint`}
            >
              Horários
            </button>
          </li>
        ))}
      </ul>
      {items.length > SHOWN ? (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          className="min-h-11 w-full text-sm font-bold text-primary-text"
        >
          {all ? "Mostrar menos" : `Ver todas (${items.length})`}
        </button>
      ) : null}
    </section>
  );
}
