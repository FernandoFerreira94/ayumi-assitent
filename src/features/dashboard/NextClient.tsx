"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { EditAppointmentSheet } from "@/features/appointments/EditAppointmentSheet";
import { useValuesHidden } from "@/features/finance/hide-values";
import { CHAT_BUTTON, ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
import { formatBRL, formatShortDate, formatTime, todayStr } from "@/lib/dates";
import type { Dashboard } from "./data";
import { untilLabel } from "./rules";
import { BOX, BOX_LINK, BOX_TITLE } from "./ui";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const STATUS: Record<string, { text: string; cls: string }> = {
  confirmed: { text: "Confirmou", cls: "bg-ok-bg text-ok" },
  pending_confirmation: { text: "Sem resposta ainda", cls: "bg-wait-bg text-wait" },
  reschedule_requested: { text: "Pediu para remarcar", cls: "bg-fail-bg text-fail" },
};

const TICK = 30_000;
const subscribeClock = (cb: () => void) => {
  const t = setInterval(cb, TICK);
  return () => clearInterval(t);
};

/** Relógio de meio em meio minuto, para o "em 20 min" andar sozinho (null no servidor). */
function useNow(): Date | null {
  const tick = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / TICK),
    () => null,
  );
  return tick === null ? null : new Date(tick * TICK);
}

/**
 * Caixa "Próxima cliente" do Painel no desktop/tablet: quem é, quando, se confirmou e o que vale lembrar
 * dela (visitas, última visita, observações), com a conversa e o remarcar em folha por cima da tela.
 */
export function NextClient({ next, isToday }: { next: Dashboard["next"]; isToday: boolean }) {
  const now = useNow();
  const masked = useValuesHidden() !== false;
  if (!next) {
    return (
      <section aria-label={isToday ? "Próxima cliente" : "Primeira cliente do dia"} className={BOX}>
        <h2 className={BOX_TITLE}>{isToday ? "Próxima cliente" : "Primeira cliente do dia"}</h2>
        <p className="py-3 text-sm font-semibold text-muted">
          {isToday ? "Ninguém mais para hoje. Aproveite para chamar quem está no retorno." : "Nenhum atendimento nesse dia."}
        </p>
      </section>
    );
  }
  const status = STATUS[next.status];
  const color = next.serviceColor || "lav";
  const date = todayStr(next.startsAt);
  const notes = [next.clientNotes, next.appointmentNotes].filter(Boolean).join(" · ");
  const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold";
  const title = !isToday ? "Primeira cliente do dia" : next.current ? "Atendendo agora" : "Próxima cliente";

  return (
    <section aria-label={title} className={BOX}>
      <h2 className={BOX_TITLE}>
        {title}
        <Link href={`/clientes?q=${encodeURIComponent(next.clientName)}`} className={BOX_LINK}>
          Abrir ficha
          <Icon name="arrowRight" size={14} />
        </Link>
      </h2>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full text-lg font-bold"
          style={{ background: `var(--svc-${color}-soft)`, color: `var(--svc-${color}-ink)` }}
        >
          {initials(next.clientName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{next.clientName}</p>
          <p className="truncate text-sm font-semibold text-muted">
            {formatTime(next.startsAt)}–{formatTime(next.endsAt)} · {next.serviceName} ·{" "}
            <span data-money>{masked ? "R$ •••" : formatBRL(next.priceCents)}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
            {status ? <span className={`rounded-full px-2.5 py-1 ${status.cls}`}>{status.text}</span> : null}
            <span className="rounded-full bg-soft px-2.5 py-1 text-primary-text">
              {next.visits === 0 ? "Primeira visita" : `${next.visits + 1}ª visita`}
            </span>
            {next.noShows > 0 ? (
              <span className="rounded-full bg-wait-bg px-2.5 py-1 text-wait">
                {next.noShows} {next.noShows === 1 ? "falta" : "faltas"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold text-primary-text" aria-live="polite">
            {!isToday ? formatTime(next.startsAt) : next.current ? "agora" : now ? untilLabel(next.startsAt, now) : formatTime(next.startsAt)}
          </p>
          {next.after ? (
            <p className="text-xs font-semibold text-muted">
              depois: {next.after.name.split(/\s+/)[0]} {formatTime(next.after.startsAt)}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-line pt-3 text-xs font-semibold text-muted">
        <div>
          <dt>Última visita</dt>
          <dd className="truncate text-sm font-bold text-fg">
            {next.lastVisit ? `${formatShortDate(todayStr(next.lastVisit.startsAt))} · ${next.lastVisit.service}` : "—"}
          </dd>
        </div>
        <div>
          <dt>Visitas concluídas</dt>
          <dd className="text-sm font-bold text-fg">{next.visits}</dd>
        </div>
        <div>
          <dt>Já gastou</dt>
          <dd className="text-sm font-bold text-fg" data-money>
            {masked ? "R$ •••••" : formatBRL(next.spentCents)}
          </dd>
        </div>
      </dl>

      {notes ? (
        <p className="mt-3 rounded-xl bg-wait-bg px-3 py-2 text-sm font-semibold text-wait">
          <span className="sr-only">Observação: </span>
          {notes}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <ChatSheet clientId={next.clientId} clientName={next.clientName} phone={next.phone} triggerClassName={`${btn} ${CHAT_BUTTON}`}>
          <ChatGlyph />
          Conversa
        </ChatSheet>
        <EditAppointmentSheet
          id={next.appointmentId}
          clientName={next.clientName}
          serviceId={next.serviceId}
          serviceName={next.serviceName}
          date={date}
          start={formatTime(next.startsAt)}
          minutes={Math.round((next.endsAt.getTime() - next.startsAt.getTime()) / 60_000)}
          nested={false}
          triggerClassName={`${btn} btn-glass`}
        />
      </div>
    </section>
  );
}
