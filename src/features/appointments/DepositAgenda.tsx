"use client";

import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { formatBRL, formatTime, todayStr } from "@/lib/dates";
import { AppointmentCard } from "./AppointmentCard";
import {
  byDay,
  dayHeading,
  depositGroup,
  DEPOSIT_GROUPS,
  GROUP_LABEL,
  inPeriod,
  PERIOD_LABEL,
  PERIODS,
  summarize,
  type DepositGroup,
  type DepositItem,
  type Period,
} from "./deposit-list";
import type { Status } from "./schema";

export type AgendaItem = DepositItem & {
  minutes: number;
  clientId: string;
  clientPhone: string;
  serviceId: string;
  priceCents: number;
  status: Status;
};

const STATUS_LABEL: Partial<Record<Status, string>> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  reschedule_requested: "Quer remarcar",
  done: "Concluído",
};

/** Cor de cada grupo: pago/sinal pago em verde, pedido em âmbar, sem sinal em lavanda. */
const TONE: Record<DepositGroup, { card: string; text: string; icon: "checkCircle" | "wallet" | "clock" }> = {
  deposit: { card: "bg-ok-bg", text: "text-ok", icon: "checkCircle" },
  requested: { card: "bg-wait-bg", text: "text-wait", icon: "clock" },
  none: { card: "bg-soft", text: "text-primary-text", icon: "wallet" },
  paid: { card: "bg-ok-bg", text: "text-ok", icon: "checkCircle" },
};

/** Frase curta do resumo, embaixo do número. */
const HINT: Record<DepositGroup, string> = {
  deposit: "já entrou de sinal",
  requested: "esperando a cliente",
  none: "a receber no dia",
  paid: "pago tudo",
};

const chip =
  "flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold aria-pressed:bg-surface aria-pressed:shadow-sm";

/** Valor grande da linha e a frase embaixo, por grupo. */
function amountOf(x: DepositItem): { main: string; sub: string } {
  const p = x.payment;
  switch (depositGroup(p)) {
    case "deposit":
      return { main: formatBRL(p.paidCents), sub: `falta ${formatBRL(p.remainingCents)}` };
    case "requested":
      return { main: formatBRL(p.requestedCents), sub: "sinal pedido" };
    case "none":
      return { main: formatBRL(p.remainingCents), sub: "sem sinal" };
    default:
      return { main: formatBRL(p.paidCents), sub: "pago" };
  }
}

/**
 * Agendamentos em lista, com o sinal de cada um: só visão. Filtro de período e de sinal sem sair da tela
 * (a URL acompanha, sem recarregar); tocar na linha abre o atendimento numa folha, onde dá marcar "Sinal recebido".
 */
export function DepositAgenda({
  items,
  initialPeriod,
  initialGroup,
}: {
  items: AgendaItem[];
  initialPeriod: Period;
  initialGroup: DepositGroup | null;
}) {
  const side = useSheetSide();
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [group, setGroup] = useState<DepositGroup | null>(initialGroup);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  // "Agora" fixo na montagem: a lista não muda de dia sozinha enquanto a pessoa olha
  const [now] = useState(() => new Date());

  const scoped = useMemo(() => inPeriod(items, period, q, now), [items, period, q, now]);
  const sum = useMemo(() => summarize(scoped), [scoped]);
  const shown = group ? scoped.filter((x) => depositGroup(x.payment) === group) : scoped;
  const days = byDay(shown);
  const detail = openId ? items.find((x) => x.id === openId) : undefined;

  function syncUrl(p: Period, g: DepositGroup | null) {
    const u = new URL(window.location.href);
    u.searchParams.set("periodo", p);
    if (g) u.searchParams.set("sinal", g);
    else u.searchParams.delete("sinal");
    window.history.replaceState(window.history.state, "", u);
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      {/* Resumo: cada caixa também é o filtro do grupo */}
      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 lg:grid-cols-[repeat(4,minmax(0,1fr))]" role="group" aria-label="Filtrar pelo sinal">
        {DEPOSIT_GROUPS.map((g) => {
          const on = group === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const next = on ? null : g;
                setGroup(next);
                syncUrl(period, next);
              }}
              className={`grid min-h-24 min-w-0 content-start gap-0.5 rounded-2xl px-4 py-3 text-left outline-offset-2 transition-shadow ${TONE[g].card} ${
                on ? "ring-2 ring-primary" : ""
              }`}
            >
              <span className={`flex min-w-0 items-center gap-1.5 text-xs font-bold ${TONE[g].text}`}>
                <Icon name={TONE[g].icon} size={16} />
                {GROUP_LABEL[g]}
                <span className="ml-auto rounded-full bg-surface/70 px-2 tabular-nums">{sum[g].count}</span>
              </span>
              <span className={`truncate text-[22px] font-bold tabular-nums md:text-2xl ${TONE[g].text}`}>{formatBRL(sum[g].cents)}</span>
              <span className="truncate text-xs font-semibold text-muted">{HINT[g]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 md:flex md:items-center">
        <div role="group" aria-label="Período" className="flex gap-1 rounded-full bg-soft p-1 md:w-auto">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => {
                setPeriod(p);
                syncUrl(p, group);
              }}
              className={`${chip} flex-1`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <input
            type="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar cliente"
            placeholder="Buscar cliente"
            className="min-h-12 w-full rounded-full border px-4 pr-11 text-base font-semibold"
          />
          <Icon name="search" size={18} className="pointer-events-none absolute right-4 top-3.5 text-muted" />
        </div>
      </div>

      {group ? (
        <p className="flex items-center gap-2 px-1 text-sm font-semibold text-muted">
          Mostrando só <b className={TONE[group].text}>{GROUP_LABEL[group].toLowerCase()}</b>
          <button
            type="button"
            onClick={() => {
              setGroup(null);
              syncUrl(period, null);
            }}
            className="min-h-11 rounded-full px-3 font-bold text-primary-text underline"
          >
            Ver todos
          </button>
        </p>
      ) : null}

      {days.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={q ? "Nenhuma cliente com esse nome" : "Nada por aqui"}
          description={
            q
              ? "Confira o nome ou limpe a busca."
              : group
                ? `Nenhum agendamento com "${GROUP_LABEL[group].toLowerCase()}" nesse período.`
                : "Nenhum agendamento nesse período."
          }
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
          {days.map((d) => (
            <section key={d.date} aria-labelledby={`dia-${d.date}`} className="grid grid-cols-[minmax(0,1fr)] gap-2">
              <h2 id={`dia-${d.date}`} className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
                {dayHeading(d.date, now)} <span className="normal-case tracking-normal">· {d.items.length}</span>
              </h2>
              <ul className="glass divide-y divide-line rounded-2xl px-2">
                {d.items.map((x) => {
                  const g = depositGroup(x.payment);
                  const a = amountOf(x);
                  return (
                    <li key={x.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(x.id)}
                        data-group={g}
                        className="flex min-h-16 w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left"
                      >
                        <span className="w-12 shrink-0 text-base font-bold tabular-nums text-primary-text">
                          {formatTime(x.startsAt)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{x.clientName}</span>
                          <span className="block truncate text-xs font-semibold text-muted">
                            {x.serviceName}
                            {STATUS_LABEL[x.status] ? ` · ${STATUS_LABEL[x.status]}` : ""}
                          </span>
                        </span>
                        <span className="grid shrink-0 justify-items-end leading-tight">
                          <span className={`text-lg font-bold tabular-nums ${TONE[g].text}`}>{a.main}</span>
                          <span className={`text-xs font-semibold ${g === "none" ? "text-muted" : TONE[g].text}`}>
                            {a.sub}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Drawer.Root
        direction={side}
        repositionInputs={false}
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setOpenId(null)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
          <Drawer.Content
            className={sheetClass(
              side,
              "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none",
              "sheet z-50",
            )}
          >
            <SidePanelClose />
            <Drawer.Title className="pb-1 text-xl font-bold">{detail?.clientName ?? "Agendamento"}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              {detail ? `${dayHeading(todayStr(detail.startsAt), now)} · ${formatTime(detail.startsAt)}` : ""}
            </Drawer.Description>
            {detail ? (
              <ul className="grid gap-2">
                <AppointmentCard
                  inSheet
                  id={detail.id}
                  time={formatTime(detail.startsAt)}
                  date={todayStr(detail.startsAt)}
                  start={formatTime(detail.startsAt)}
                  minutes={detail.minutes}
                  clientId={detail.clientId}
                  clientName={detail.clientName}
                  clientPhone={detail.clientPhone}
                  serviceId={detail.serviceId}
                  serviceName={detail.serviceName}
                  price={formatBRL(detail.priceCents)}
                  status={detail.status}
                  payment={detail.payment}
                  onSettled={() => setOpenId(null)}
                />
              </ul>
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
