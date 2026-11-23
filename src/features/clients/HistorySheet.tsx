"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon, type IconName } from "@/components/ui/Icon";
import { loadClientHistory, type HistoryHeader, type HistoryItem } from "./actions";
import { HISTORY_FILTER_LABEL, HISTORY_FILTERS, type HistoryFilter, type Tone } from "./history-rules";

const TONE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok",
  wait: "bg-wait-bg text-wait",
  fail: "bg-fail-bg text-fail",
  muted: "bg-bg text-muted",
  info: "bg-soft text-primary-text",
};
const AMOUNT: Record<Tone, string> = {
  ok: "text-ok",
  wait: "text-wait",
  fail: "text-fail",
  muted: "text-muted line-through",
  info: "text-primary-text",
};

const EMPTY: Record<HistoryFilter, string> = {
  all: "Ainda não tem nada no histórico. O primeiro agendamento aparece aqui.",
  visits: "Nenhum atendimento ainda.",
  plans: "Nenhum pacote ou plano comprado.",
  payments: "Nenhum pagamento lançado.",
  no_show: "Nenhuma falta. Cliente pontual!",
};

function iconFor(item: HistoryItem): IconName {
  if (item.kind === "package") return "ticket";
  if (item.kind === "money") return "coins";
  if (item.badge?.tone === "ok") return "checkCircle";
  if (item.badge?.tone === "fail") return "userX";
  if (item.badge?.tone === "muted") return "close";
  return "calendar";
}

type Loaded = {
  /** filtro + tentativa que geraram esta lista; diferente do atual = carregando */
  key: string;
  summary: HistoryHeader | null;
  items: HistoryItem[];
  next: string | null;
  failed: boolean;
  /** carregando a próxima página (a lista atual continua na tela) */
  more: "idle" | "loading" | "error";
};

/** Busca o histórico por filtro; o resumo vem só na 1ª página e fica guardado ao trocar de filtro. */
function useHistory(clientId: string, open: boolean, filter: HistoryFilter) {
  const [attempt, setAttempt] = useState(0);
  const key = `${clientId}:${filter}:${attempt}`;
  const [data, setData] = useState<Loaded | null>(null);
  const req = useRef(0);

  useEffect(() => {
    if (!open) return;
    const id = ++req.current;
    loadClientHistory(clientId, filter, null)
      .catch(() => null)
      .then((res) =>
        setData((s) => {
          if (id !== req.current) return s;
          if (!res?.ok) return { key, summary: s?.summary ?? null, items: [], next: null, failed: true, more: "idle" };
          return {
            key,
            summary: res.data.summary ?? s?.summary ?? null,
            items: res.data.items,
            next: res.data.next,
            failed: false,
            more: "idle",
          };
        }),
      );
  }, [clientId, open, filter, key]);

  const ready = data?.key === key ? data : null;
  const loadMore = () => {
    const cursor = ready?.next;
    if (!cursor || ready.more === "loading") return;
    const id = req.current;
    setData((s) => (s ? { ...s, more: "loading" } : s));
    loadClientHistory(clientId, filter, cursor)
      .catch(() => null)
      .then((res) =>
        setData((s) => {
          if (id !== req.current || !s) return s;
          if (!res?.ok) return { ...s, more: "error" };
          return { ...s, items: [...s.items, ...res.data.items], next: res.data.next, more: "idle" };
        }),
      );
  };

  const state = {
    summary: data?.summary ?? null,
    items: ready?.items ?? [],
    next: ready?.next ?? null,
    status: !ready ? ("loading" as const) : ready.failed ? ("error" as const) : ("ready" as const),
    more: ready?.more ?? ("idle" as const),
  };
  return { state, retry: () => setAttempt((n) => n + 1), loadMore };
}

/**
 * Botão "Histórico" da ficha: abre por cima a linha do tempo completa da cliente (atendimentos, planos,
 * pagamentos, faltas), com resumo em números grandes e filtros. Carrega 20 por vez.
 */
export function HistorySheet({
  clientId,
  clientName,
  nested,
  triggerClassName,
}: {
  clientId: string;
  clientName: string;
  nested: boolean;
  triggerClassName: string;
}) {
  const side = useSheetSide();
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const { state, retry, loadMore } = useHistory(clientId, open, filter);
  const first = clientName.split(/\s+/)[0];

  // Auto-carrega ao chegar no fim da lista (o botão continua para quem não rola)
  const sentinel = useRef<HTMLDivElement | null>(null);
  const more = useRef(loadMore);
  useEffect(() => {
    more.current = loadMore;
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !state.next || state.more !== "idle") return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more.current(), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [state.next, state.more]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) setFilter("all");
  }

  const months: { month: string; items: HistoryItem[] }[] = [];
  for (const it of state.items) {
    const last = months.at(-1);
    if (last?.month === it.month) last.items.push(it);
    else months.push({ month: it.month, items: [it] });
  }

  return (
    <Root direction={side} open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger className={triggerClassName}>
        <Icon name="clock" size={20} />
        Histórico
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-16px))] max-w-[560px] rounded-t-3xl pt-4 outline-none",
            "sheet z-50 flex flex-col",
          )}
          // Leitura longa: fundo opaco, sem a ficha aparecendo por trás do vidro
          style={{ background: "linear-gradient(180deg, #fff, #f8f7fc)" }}
        >
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pb-1 pr-12 text-xl font-bold">Histórico de {first}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Atendimentos, planos, pagamentos e faltas, do mais recente ao mais antigo.
            </Drawer.Description>

            <Summary summary={state.summary} loading={state.status === "loading" && !state.summary} />

            <div
              role="tablist"
              aria-label="Filtrar histórico"
              className="sticky top-0 z-10 -mx-5 mb-3 flex gap-1.5 overflow-x-auto bg-white/90 px-5 py-2 backdrop-blur md:mx-0 md:px-0"
            >
              {HISTORY_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className="min-h-11 shrink-0 rounded-full border border-line bg-surface px-3.5 text-sm font-bold text-muted transition-colors aria-selected:border-primary aria-selected:bg-primary aria-selected:text-on-primary"
                >
                  {HISTORY_FILTER_LABEL[f]}
                </button>
              ))}
            </div>

            {state.status === "error" ? (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail"
              >
                Não deu para carregar o histórico.
                <button type="button" onClick={retry} className="min-h-11 px-2 font-bold underline">
                  Tentar de novo
                </button>
              </div>
            ) : state.status === "loading" ? (
              <div className="grid gap-2" aria-busy="true" aria-label="Carregando histórico">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skel h-20 rounded-2xl" />
                ))}
              </div>
            ) : state.items.length === 0 ? (
              <p className="glass rounded-2xl px-4 py-8 text-center font-semibold text-muted">{EMPTY[filter]}</p>
            ) : (
              <div className="grid gap-4 pb-2">
                {months.map((m) => (
                  <section key={m.month} aria-label={m.month}>
                    <h3 className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">{m.month}</h3>
                    <ol className="grid gap-2">
                      {m.items.map((it) => (
                        <Row key={it.key} item={it} />
                      ))}
                    </ol>
                  </section>
                ))}
                {state.next ? (
                  <div ref={sentinel}>
                    {state.more === "error" ? (
                      <div
                        role="alert"
                        className="flex items-center justify-between gap-3 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail"
                      >
                        Não deu para carregar mais.
                        <button type="button" onClick={loadMore} className="min-h-11 px-2 font-bold underline">
                          Tentar de novo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={state.more === "loading"}
                        aria-busy={state.more === "loading"}
                        className="btn-glass flex min-h-12 w-full items-center justify-center rounded-2xl font-bold"
                      >
                        {state.more === "loading" ? "Carregando…" : "Ver mais antigos"}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="pt-1 text-center text-xs font-semibold text-muted">Início do histórico</p>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}

function Summary({ summary: s, loading }: { summary: HistoryHeader | null; loading: boolean }) {
  if (loading)
    return (
      <div className="mb-3 grid gap-2" aria-busy="true" aria-label="Carregando resumo">
        <div className="skel h-24 rounded-2xl" />
      </div>
    );
  if (!s) return null;
  const facts = [
    s.attendance !== null ? `Comparece em ${s.attendance}% das vezes` : null,
    s.lastVisit ? `Última visita ${s.lastVisit}` : null,
    s.cancelled ? `${s.cancelled} ${s.cancelled === 1 ? "cancelamento" : "cancelamentos"}` : null,
    s.since ? `Cliente desde ${s.since.toLowerCase()}` : null,
  ].filter(Boolean);
  return (
    <div className="mb-3 grid gap-2">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="glass flex flex-col-reverse rounded-2xl px-2 py-3">
          <dt className="text-xs font-semibold text-muted">{s.done === 1 ? "atendimento" : "atendimentos"}</dt>
          <dd className="text-3xl font-bold tabular-nums text-primary-text">{s.done}</dd>
        </div>
        <div className="glass flex flex-col-reverse rounded-2xl px-2 py-3">
          <dt className="text-xs font-semibold text-muted">{s.noShows === 1 ? "falta" : "faltas"}</dt>
          <dd className={`text-3xl font-bold tabular-nums ${s.noShows ? "text-fail" : ""}`}>{s.noShows}</dd>
        </div>
        <div className="glass flex flex-col-reverse rounded-2xl px-2 py-3">
          <dt className="text-xs font-semibold text-muted">gastou</dt>
          <dd className="pt-1.5 text-lg font-bold tabular-nums text-ok">{s.spent}</dd>
        </div>
      </dl>
      {facts.length ? (
        <p className="px-1 text-sm font-semibold text-muted">{facts.join(" · ")}</p>
      ) : null}
      {s.next ? (
        <p className="glass rounded-2xl px-4 py-3 text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide text-muted">Próximo horário</span>
          <span className="font-bold first-letter:uppercase">{s.next}</span>
        </p>
      ) : null}
      {s.plans.length || s.credit ? (
        <div className="glass grid gap-1 rounded-2xl px-4 py-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Plano ativo</span>
          {s.plans.map((p, i) => (
            <span key={i} className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 font-bold">{p.name}</span>
              <span className="shrink-0 font-semibold text-muted">
                <b className="text-base text-primary-text tabular-nums">{p.left}</b> de {p.total}
                {p.until ? ` · até ${p.until}` : ""}
              </span>
            </span>
          ))}
          {!s.plans.length ? <span className="font-semibold text-muted">Nenhum</span> : null}
          {s.credit ? (
            <span className="flex items-baseline justify-between gap-2 border-t border-line pt-1">
              <span className="font-bold">Crédito no salão</span>
              <b className="text-base text-ok tabular-nums">{s.credit}</b>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Row({ item }: { item: HistoryItem }) {
  return (
    <li className="glass flex gap-3 rounded-2xl px-3 py-3">
      <span
        aria-hidden="true"
        className={`grid size-10 shrink-0 place-content-center rounded-xl ${TONE[item.badge?.tone ?? item.amountTone ?? "info"]}`}
      >
        <Icon name={iconFor(item)} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 font-bold leading-snug">{item.title}</p>
          {item.amount ? (
            <span className={`shrink-0 font-bold tabular-nums ${item.amountTone ? AMOUNT[item.amountTone] : ""}`}>
              {item.amount}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold text-muted first-letter:uppercase">{item.when}</p>
        {item.badge || item.tags.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {item.badge ? (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[item.badge.tone]}`}>
                {item.badge.text}
              </span>
            ) : null}
            {item.tags.map((t) => (
              <span key={t.text} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[t.tone]}`}>
                {t.text}
              </span>
            ))}
          </div>
        ) : null}
        {item.detail ? <p className="pt-1 text-sm font-semibold text-muted">{item.detail}</p> : null}
      </div>
    </li>
  );
}
