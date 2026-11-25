"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon } from "@/components/ui/Icon";
import { notify } from "@/components/feedback/toast";
import { deleteClients, previewDeleteClients, type BulkDeletePreview, type BulkDeleteResult } from "./actions";
import { BULK_DELETE_MAX } from "./schema";
import type { ErrorCode } from "@/lib/errors";

/** Partes do tamanho que o servidor aceita por chamada (Selecionar todas pode passar disso). */
const chunks = (ids: string[]) =>
  Array.from({ length: Math.ceil(ids.length / BULK_DELETE_MAX) }, (_, i) =>
    ids.slice(i * BULK_DELETE_MAX, (i + 1) * BULK_DELETE_MAX),
  );

async function previewAll(ids: string[]): Promise<BulkDeletePreview | null> {
  const sum: BulkDeletePreview = { found: 0, anonymize: 0, future: 0 };
  for (const part of chunks(ids)) {
    const r = await previewDeleteClients(part);
    if (!r.ok) return null;
    sum.found += r.data.found;
    sum.anonymize += r.data.anonymize;
    sum.future += r.data.future;
  }
  return sum;
}

/** Exclui parte por parte; uma parte que falha inteira conta como falha e as outras seguem. */
async function deleteAll(ids: string[]): Promise<BulkDeleteResult & { error?: ErrorCode }> {
  const sum: BulkDeleteResult & { error?: ErrorCode } = { removed: 0, anonymized: 0, failed: 0 };
  for (const part of chunks(ids)) {
    const r = await deleteClients(part).catch(() => null);
    if (r?.ok) {
      sum.removed += r.data.removed;
      sum.anonymized += r.data.anonymized;
      sum.failed += r.data.failed;
    } else {
      sum.failed += part.length;
      sum.error = r && !r.ok ? r.code : "NETWORK";
    }
  }
  return sum;
}

/**
 * Seleção de várias clientes em /clientes (celular e desktop), como no app Fotos do iPhone:
 * "Selecionar" liga o modo, cada linha vira um marcador, a barra de baixo troca a de abas.
 * As ações ficam em `ACTIONS` (hoje só Excluir) para as próximas entrarem sem mexer na barra.
 */
type Bulk = {
  on: boolean;
  start: () => void;
  stop: () => void;
  /** Só as escolhidas que estão na lista de agora (busca/filtro). */
  selected: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  visibleIds: string[];
  setAll: (on: boolean) => void;
};

const BulkCtx = createContext<Bulk | null>(null);
export const useBulk = () => useContext(BulkCtx);

export function BulkProvider({ visibleIds, children }: { visibleIds: string[]; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const visibleKey = visibleIds.join(",");
  const visible = useMemo(() => new Set(visibleKey ? visibleKey.split(",") : []), [visibleKey]);
  // Trocou a busca ou o filtro: vale só quem continua à vista (nada escondido é excluído)
  const selected = useMemo(() => [...picked].filter((id) => visible.has(id)), [picked, visible]);

  // No modo seleção a barra de abas sai e a barra de ações entra no lugar dela
  useEffect(() => {
    const html = document.documentElement;
    if (on) html.dataset.select = "";
    else delete html.dataset.select;
    return () => void delete html.dataset.select;
  }, [on]);

  const value: Bulk = {
    on,
    start: () => setOn(true),
    stop: () => {
      setOn(false);
      setPicked(new Set());
    },
    selected,
    isSelected: (id) => picked.has(id) && visible.has(id),
    toggle: (id) =>
      setPicked((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    visibleIds,
    setAll: (all) => setPicked(all ? new Set(visibleIds) : new Set()),
  };
  return <BulkCtx.Provider value={value}>{children}</BulkCtx.Provider>;
}

const word = (n: number) => (n === 1 ? "cliente" : "clientes");
const picked = (n: number) => (n === 1 ? "selecionada" : "selecionadas");

/** Botão do topo: "Selecionar" liga o modo; dentro dele vira "Cancelar". */
export function SelectButton() {
  const bulk = useBulk();
  if (!bulk || bulk.visibleIds.length === 0) return null;
  return (
    <button
      type="button"
      onClick={bulk.on ? bulk.stop : bulk.start}
      aria-pressed={bulk.on}
      data-testid="select-toggle"
      className="btn-glass min-h-11 shrink-0 rounded-full px-4 text-base font-bold text-primary-text"
    >
      {bulk.on ? "Cancelar" : "Selecionar"}
    </button>
  );
}

/** Faixa acima da lista no modo seleção: quantas estão escolhidas e Selecionar todas / Limpar. */
export function BulkHeader() {
  const bulk = useBulk();
  if (!bulk?.on) return null;
  const n = bulk.selected.length;
  const all = n > 0 && n === bulk.visibleIds.length;
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-2 rounded-2xl bg-soft px-4 py-1">
      <span aria-live="polite" className="text-base font-bold" data-testid="select-count">
        {n === 0 ? "Toque para escolher" : `${n} ${picked(n)}`}
      </span>
      <button
        type="button"
        onClick={() => bulk.setAll(!all)}
        className="min-h-11 rounded-full px-2 text-base font-bold text-primary-text"
      >
        {all ? "Limpar" : `Selecionar todas (${bulk.visibleIds.length})`}
      </button>
    </div>
  );
}

/** Ações da barra. Para uma nova (arquivar, etiquetar…), basta pôr aqui. */
const ACTIONS = [{ key: "delete", label: "Excluir", tone: "fail" }] as const;
type ActionKey = (typeof ACTIONS)[number]["key"];

/** Barra fixa embaixo com as ações para as escolhidas. */
export function BulkBar() {
  const bulk = useBulk();
  const [open, setOpen] = useState<ActionKey | null>(null);
  // Cada abertura confere o histórico de novo (pode ter mudado desde a última)
  const [round, setRound] = useState(0);
  if (!bulk?.on) return null;
  const n = bulk.selected.length;
  return (
    <>
      <div
        role="toolbar"
        aria-label="Ações para as clientes escolhidas"
        className="bulkbar glass fixed inset-x-3 z-30 mx-auto flex max-w-[496px] lg:sticky lg:inset-x-auto lg:bottom-6 lg:mt-4 items-center gap-2 rounded-[1.75rem] p-2 pl-5 shadow-lg"
      >
        <span className="min-w-0 flex-1 truncate text-base font-bold">
          {n === 0 ? "Nenhuma escolhida" : `${n} ${picked(n)}`}
        </span>
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            disabled={n === 0}
            onClick={() => {
              setRound((r) => r + 1);
              setOpen(a.key);
            }}
            className={`flex min-h-12 items-center gap-2 rounded-full px-5 text-base font-bold disabled:opacity-40 ${a.tone === "fail" ? "bg-fail text-white" : "btn-tint"}`}
          >
            {a.key === "delete" ? <TrashGlyph /> : null}
            {a.label}
          </button>
        ))}
      </div>
      <BulkDeleteSheet
        ids={bulk.selected}
        round={round}
        open={open === "delete"}
        onOpenChange={(v) => setOpen(v ? "delete" : null)}
        onDone={bulk.stop}
      />
    </>
  );
}

function TrashGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5M14 11v5" />
    </svg>
  );
}

/** Marcador redondo da linha (como no iPhone). */
export function CheckMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-primary bg-primary text-on-primary" : "border-line bg-transparent"}`}
    >
      {on ? <Icon name="check" size={16} /> : null}
    </span>
  );
}

/** Confirmação: quantas saem de vez, quantas viram "Cliente removida" e quem tem horário marcado. */
function BulkDeleteSheet({
  ids,
  round,
  open,
  onOpenChange,
  onDone,
}: {
  ids: string[];
  round: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const side = useSheetSide();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<{ tag: string; v: BulkDeletePreview | "error" } | null>(null);
  const key = ids.join(",");
  const tag = `${round}|${key}`;
  // null = conferindo; a resposta de uma abertura antiga (ou de outra seleção) não vale
  const info = loaded?.tag === tag ? loaded.v : null;

  useEffect(() => {
    if (!open || !key) return;
    let alive = true;
    previewAll(key.split(","))
      .then((v) => alive && setLoaded({ tag, v: v ?? "error" }))
      .catch(() => alive && setLoaded({ tag, v: "error" }));
    return () => {
      alive = false;
    };
  }, [open, key, tag]);

  async function confirm() {
    setBusy(true);
    const toastId = notify.loading(`Excluindo ${ids.length} ${word(ids.length)}…`);
    const res = await deleteAll(ids);
    setBusy(false);
    notify.dismiss(toastId);
    const done = res.removed + res.anonymized;
    // Nada saiu por erro de rede/servidor: o diálogo fica aberto para tentar de novo
    if (done === 0 && res.error) {
      notify.error(res.error, () => void confirm());
      return;
    }
    onOpenChange(false);
    if (res.failed === 0) {
      notify.success(done === 1 ? "Cliente excluída" : `${done} clientes excluídas`);
      onDone();
    } else if (done > 0) {
      notify.warning(
        `${done} ${done === 1 ? "excluída" : "excluídas"}, ${res.failed} não`,
        "As que não saíram continuam na lista. Tente de novo com elas.",
      );
      onDone();
    } else {
      notify.problem("Nenhuma cliente foi excluída", "Atualize a página e tente de novo.");
    }
  }

  const n = ids.length;
  const ready = info && info !== "error";
  const removeNow = ready ? info.found - info.anonymize : 0;

  return (
    <Drawer.Root
      direction={side}
      open={open}
      dismissible={!busy}
      onOpenChange={(v) => {
        if (busy) return;
        onOpenChange(v);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none",
            "sheet z-50",
          )}
          // Texto de decisão importante: fundo opaco, sem a lista aparecendo por trás do vidro
          style={{ background: "linear-gradient(180deg, #fff, #f8f7fc)" }}
        >
          <SidePanelClose />
          <Drawer.Title className="pb-1 text-xl font-bold">
            Excluir {n} {word(n)}?
          </Drawer.Title>
          <Drawer.Description asChild>
            <div className="grid gap-3 pb-4 text-base font-semibold text-muted" aria-live="polite">
              {info === null ? (
                <p className="flex items-center gap-2">
                  <span className="spin" aria-hidden="true" /> Conferindo o histórico delas…
                </p>
              ) : info === "error" ? (
                <p>
                  Não deu para conferir o histórico agora. Se excluir, quem já foi atendida vira &quot;Cliente
                  removida&quot; no financeiro.
                </p>
              ) : (
                <>
                  <ul className="grid gap-1.5" data-testid="bulk-preview">
                    {removeNow > 0 ? (
                      <li>
                        <b className="text-2xl font-bold tabular-nums text-fg">{removeNow}</b> saem de vez (sem nenhum
                        horário nem pagamento).
                      </li>
                    ) : null}
                    {info.anonymize > 0 ? (
                      <li>
                        <b className="text-2xl font-bold tabular-nums text-fg">{info.anonymize}</b>{" "}
                        {info.anonymize === 1 ? "tem histórico e fica" : "têm histórico e ficam"} como &quot;Cliente
                        removida&quot; na agenda e no financeiro. Nome, telefone e conversa saem do app.
                      </li>
                    ) : null}
                    {info.found < n ? (
                      <li>
                        {n - info.found} {n - info.found === 1 ? "já tinha saído" : "já tinham saído"} e{" "}
                        {n - info.found === 1 ? "será ignorada" : "serão ignoradas"}.
                      </li>
                    ) : null}
                  </ul>
                  {info.future > 0 ? (
                    <p className="rounded-2xl bg-wait-bg px-4 py-3 text-fg" role="note">
                      {info.future === 1 ? "1 tem horário marcado" : `${info.future} têm horário marcado`}. O horário
                      continua na agenda como &quot;Cliente removida&quot; e não sai lembrete. Se não vai acontecer,
                      cancele antes.
                    </p>
                  ) : null}
                </>
              )}
              <p className="font-bold text-fail">Não dá para desfazer.</p>
            </div>
          </Drawer.Description>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={busy || info === null}
              aria-busy={busy}
              data-testid="bulk-confirm"
              className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-fail px-5 text-base font-bold text-white disabled:opacity-70"
            >
              {busy ? <span className="spin" aria-hidden="true" /> : null}
              {busy ? "Excluindo…" : `Excluir ${n} ${word(n)}`}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="btn-glass flex min-h-13 items-center justify-center rounded-2xl px-5 text-base font-bold"
            >
              Cancelar
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
