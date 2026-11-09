"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { EmptyState } from "@/components/feedback/EmptyState";
import { notify } from "@/components/feedback/toast";
import { formatBRL } from "@/lib/dates";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { duplicateService, reorderServices, setServiceActive } from "./actions";
import { averagePrice, filterServices, formatDuration, moveService, type CatalogService } from "./catalog";
import { ServiceForm } from "./ServiceForm";

type Sheet = { kind: "service"; service?: CatalogService; preset?: { name?: string } };

/** Lista de serviços, com busca, reordenar e a folha de criar/editar. */
export function ServicesCatalog({ services, startWithNew }: { services: CatalogService[]; startWithNew: boolean }) {
  const router = useRouter();
  // Cópia local: reordenar e excluir aparecem na hora; o servidor manda a lista nova depois
  const [list, setList] = useState(services);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [synced, setSynced] = useState(services);
  if (synced !== services) {
    setSynced(services);
    setList(services);
  }

  const [query, setQuery] = useState("");
  // Vagas manda para cá com ?novo=1 para criar o primeiro serviço: a folha já nasce aberta
  const [sheet, setSheet] = useState<Sheet | null>(startWithNew ? { kind: "service" } : null);
  const [open, setOpen] = useState(startWithNew);
  const [sheetKey, setSheetKey] = useState(0);
  const keyboard = useKeyboardInset(open);

  const openSheet = (s: Sheet) => {
    setSheet(s);
    setSheetKey((k) => k + 1);
    setOpen(true);
  };

  useEffect(() => {
    if (startWithNew) router.replace("/servicos", { scroll: false });
  }, [startWithNew, router]);

  const shown = list.filter((s) => !hidden.has(s.id));
  const active = shown.filter((s) => s.bookable);
  const visible = filterServices(shown, query);
  const newPreset = (name = "") => ({ name });

  /* reordenar: arrastar pela alça (ou setas do teclado) dentro do grupo */
  const listRef = useRef(list);
  listRef.current = list;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const drag = useRef<{ id: string; y0: number; h: number; start: string[] } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; dy: number } | null>(null);

  const neighbor = (id: string, step: 1 | -1) => {
    const v = visibleRef.current;
    const i = v.findIndex((s) => s.id === id);
    return i < 0 ? undefined : v[i + step]?.id;
  };

  async function persistOrder(before: string[]) {
    const ids = listRef.current.map((s) => s.id);
    if (ids.join() === before.join()) return;
    const res = await reorderServices(ids);
    if (!res.ok) {
      setList((l) => before.map((id) => l.find((s) => s.id === id)!).filter(Boolean));
      return notify.error(res.code);
    }
    notify.success("Ordem salva", "É a mesma ordem do novo agendamento");
  }

  function gripDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const row = e.currentTarget.closest("li");
    drag.current = { id, y0: e.clientY, h: row?.offsetHeight ?? 60, start: listRef.current.map((s) => s.id) };
    setDragging({ id, dy: 0 });
  }

  function gripMove(e: React.PointerEvent<HTMLButtonElement>) {
    const g = drag.current;
    if (!g) return;
    let dy = e.clientY - g.y0;
    const step = dy > g.h / 2 ? 1 : dy < -g.h / 2 ? -1 : 0;
    const over = step ? neighbor(g.id, step) : undefined;
    if (over) {
      setList((l) => moveService(l, g.id, over));
      g.y0 += step * g.h;
      dy -= step * g.h;
    }
    setDragging({ id: g.id, dy });
  }

  function gripUp() {
    const g = drag.current;
    drag.current = null;
    setDragging(null);
    if (g) void persistOrder(g.start);
  }

  function gripKey(e: React.KeyboardEvent, id: string) {
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    const over = step ? neighbor(id, step) : undefined;
    if (!over) return;
    e.preventDefault();
    const before = listRef.current.map((s) => s.id);
    setList((l) => moveService(l, id, over));
    // espera o estado novo antes de salvar
    setTimeout(() => void persistOrder(before), 0);
  }

  /* ações da folha */
  async function remove(s: CatalogService) {
    setOpen(false);
    setHidden((h) => new Set(h).add(s.id));
    const unhide = () =>
      setHidden((h) => {
        const n = new Set(h);
        n.delete(s.id);
        return n;
      });
    const res = await setServiceActive(s.id, false);
    if (!res.ok) {
      unhide();
      return notify.error(res.code, () => remove(s));
    }
    notify.undoable(
      `${s.name} excluído`,
      async () => {
        const back = await setServiceActive(s.id, true);
        if (!back.ok) return notify.error(back.code);
        unhide();
      },
      s.upcoming ? "Os atendimentos já marcados continuam" : undefined,
    );
  }

  async function duplicate(s: CatalogService) {
    setOpen(false);
    const res = await duplicateService(s.id);
    if (!res.ok) return notify.error(res.code, () => duplicate(s));
    notify.success("Serviço duplicado", "Toque nele para ajustar");
  }

  const sheetTitle = sheet?.service ? "Editar serviço" : "Novo serviço";

  return (
    <>
      {list.length === 0 ? (
        <EmptyState
          title="Nenhum serviço cadastrado"
          description="Cadastre o que você atende, com duração e valor, para agendar e mostrar vagas."
          action={
            <button
              type="button"
              onClick={() => openSheet({ kind: "service", preset: newPreset() })}
              className="btn-tint inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold"
            >
              Criar serviço
            </button>
          }
        />
      ) : (
        <div className="grid gap-3">
          <dl className="grid grid-cols-2 gap-2">
            {[
              [String(active.length), active.length === 1 ? "ativo" : "ativos"],
              [formatBRL(averagePrice(shown)), "preço médio"],
            ].map(([value, name]) => (
              <div key={name} className="glass flex flex-col-reverse rounded-2xl px-3 py-2">
                <dt className="text-xs font-bold text-muted">{name}</dt>
                <dd className="truncate text-[17px] font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <label className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-muted focus-within:border-primary">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar serviço"
              aria-label="Buscar serviço"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => openSheet({ kind: "service", preset: newPreset() })}
            className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full font-bold"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Criar serviço
          </button>

          {visible.length === 0 ? (
            <div className="grid justify-items-center gap-3 px-3 py-8 text-center text-sm font-semibold text-muted">
              {query.trim() ? `Nenhum serviço com "${query.trim()}".` : "Nenhum serviço ainda."}
              <button
                type="button"
                onClick={() => openSheet({ kind: "service", preset: newPreset(query.trim()) })}
                className="min-h-10 rounded-full bg-soft px-4 font-bold text-primary-text"
              >
                {query.trim() ? `Criar "${query.trim()}"` : "Criar serviço"}
              </button>
            </div>
          ) : (
            <>
              <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
                {visible.map((s) => {
                  const lifted = dragging?.id === s.id;
                  return (
                    <li
                      key={s.id}
                      style={lifted ? { transform: `translateY(${dragging.dy}px) scale(1.02)` } : undefined}
                      className={`relative grid grid-cols-[10px_minmax(0,1fr)_auto_44px_28px] items-center gap-2.5 border-t border-line bg-surface py-2.5 pl-3 pr-1 first:border-t-0 ${
                        lifted
                          ? "z-10 rounded-2xl shadow-[0_14px_30px_-12px_rgba(23,20,43,0.4)]"
                          : "transition-transform"
                      }`}
                    >
                      <span
                        className="h-9 w-2.5 rounded-md"
                        style={{ background: `var(--svc-${s.color})` }}
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        onClick={() => openSheet({ kind: "service", service: s })}
                        className={`flex min-w-0 flex-col text-left ${s.bookable ? "" : "opacity-45"}`}
                      >
                        <b className="truncate text-[15px]">{s.name}</b>
                        <span className="text-xs font-semibold text-muted">
                          {formatDuration(s.durationMin)}
                          {s.bufferMin ? ` + ${s.bufferMin} min de intervalo` : ""}
                          {s.bookable ? "" : <span className="text-accent"> · pausado</span>}
                        </span>
                      </button>
                      <span className={`text-right text-sm font-bold tabular-nums ${s.bookable ? "" : "opacity-45"}`}>
                        {s.priceFrom ? (
                          <small className="block text-[11px] font-semibold text-muted">a partir de</small>
                        ) : null}
                        {formatBRL(s.priceCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openSheet({ kind: "service", service: s })}
                        aria-label={`Editar ${s.name}`}
                        className="grid h-11 w-11 place-items-center rounded-full text-primary-text"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-soft">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
                          </svg>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Mudar a ordem de ${s.name} (setas para cima e para baixo)`}
                        onPointerDown={(e) => gripDown(e, s.id)}
                        onPointerMove={gripMove}
                        onPointerUp={gripUp}
                        onPointerCancel={gripUp}
                        onKeyDown={(e) => gripKey(e, s.id)}
                        className="grid h-11 w-7 cursor-grab touch-none place-items-center text-[#c3bcd8] active:cursor-grabbing"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                          {[6, 12, 18].flatMap((y) =>
                            [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" />),
                          )}
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
          <Drawer.Content
            className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
            style={keyboard}
          >
            <Drawer.Handle className="mb-3" />
            <Drawer.Title className="pb-1 text-xl font-bold">{sheetTitle}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Mudar preço ou duração vale só para os próximos agendamentos.
            </Drawer.Description>
            {sheet?.kind === "service" ? (
              <ServiceForm
                key={sheetKey}
                service={sheet.service}
                preset={sheet.preset}
                services={shown}
                onSaved={() => {
                  setOpen(false);
                  setQuery("");
                }}
                onDuplicate={duplicate}
                onDelete={remove}
              />
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
