"use client";

import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { computeCustomSlots, deleteCustomList, saveCustomList, type CustomResult } from "./custom-actions";
import {
  DEFAULT_CONFIG,
  SHIFTS,
  monthDates,
  monthStart,
  monthWeeks,
  type CustomConfig,
  type SavedSlotList,
  type Shift,
} from "./custom-slots";
import { Part, ShareSheet } from "./ShareSheet";
import { toRanges } from "./share-text";

type Service = { id: string; name: string };
type Kind = CustomConfig["period"]["kind"];

const KINDS: [Kind, string][] = [
  ["month", "Mês inteiro"],
  ["weeks", "Semanas"],
  ["days", "Dias"],
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_CHOICES = [0, 1, 2, 3];

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const monthName = (first: string) => {
  const m = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" }).format(new Date(`${first}T12:00:00Z`));
  return m.charAt(0).toUpperCase() + m.slice(1);
};
const dm = (date: string) => `${date.slice(8)}/${date.slice(5, 7)}`;

function Chip({
  on,
  onClick,
  children,
  disabled,
  label,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-1 rounded-full px-3.5 text-sm font-bold disabled:opacity-40 ${on ? "btn-tint" : "btn-glass"}`}
    >
      {on ? <Icon name="check" size={16} /> : null}
      {children}
    </button>
  );
}

/**
 * Vagas > Personalizada: período (mês, semanas ou dias), filtros (serviço, dias da semana, turno),
 * vagas reais da agenda na hora, listas salvas e a geração do texto no diálogo de divulgação.
 */
export function CustomSheet({
  services,
  saved,
  today,
}: {
  services: Service[];
  saved: SavedSlotList[];
  today: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [config, setConfig] = useState<CustomConfig>({ ...DEFAULT_CONFIG, serviceId: services[0]?.id ?? null });
  const [viewOffset, setViewOffset] = useState(0); // mês exibido no seletor de dias
  const [savedId, setSavedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState<number | null>(null);
  const [res, setRes] = useState<{ key: string; data?: CustomResult; error?: ErrorCode } | null>(null);
  const [retry, setRetry] = useState(0);

  const key = JSON.stringify(config);
  const close = () => ref.current?.close();
  const active = saved.find((l) => l.id === savedId) ?? null;

  // Vagas reais da agenda, recalculadas (com pequena espera) a cada mudança de filtro.
  useEffect(() => {
    if (!opened) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await computeCustomSlots(JSON.parse(key));
        if (live) setRes(r.ok ? { key, data: r.data } : { key, error: r.code });
      } catch {
        if (live) setRes({ key, error: "NETWORK" });
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [opened, key, retry]);

  const current = res?.key === key ? res : null;
  const loading = opened && !current;
  const days = current?.data?.days ?? [];
  const total = days.reduce((n, d) => n + d.slots.length, 0);

  const set = (patch: Partial<CustomConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const setKind = (kind: Kind) => {
    if (kind === config.period.kind) return;
    if (kind === "month") set({ period: { kind, monthOffset: 0 } });
    else if (kind === "weeks") set({ period: { kind, monthOffset: 0, weeks: [] } });
    else set({ period: { kind, dates: [] } });
    setViewOffset(0);
  };
  const monthOffset = config.period.kind === "days" ? viewOffset : config.period.monthOffset;
  const pickMonth = (o: number) => {
    setViewOffset(o);
    if (config.period.kind === "month") set({ period: { kind: "month", monthOffset: o } });
    else if (config.period.kind === "weeks") set({ period: { kind: "weeks", monthOffset: o, weeks: [] } });
  };
  const first = monthStart(today, monthOffset);

  function load(l: SavedSlotList) {
    setConfig(l.config);
    setSavedId(l.id);
    setName(l.name);
    setNameError(false);
    setConfirmDelete(false);
    setViewOffset(l.config.period.kind === "days" ? 0 : l.config.period.monthOffset);
  }

  function reset() {
    setSavedId(null);
    setName("");
    setConfirmDelete(false);
    setConfig({ ...DEFAULT_CONFIG, serviceId: services[0]?.id ?? null });
    setViewOffset(0);
  }

  async function save(asNew: boolean) {
    const clean = name.trim();
    if (!clean) {
      setNameError(true);
      return;
    }
    setSaving(true);
    try {
      const r = await saveCustomList({ id: asNew ? undefined : (savedId ?? undefined), name: clean, config });
      if (r.ok) {
        setSavedId(r.data.id);
        setNameError(false);
        notify.success("Lista salva", `"${clean}" fica em Minhas listas.`);
      } else if (r.code === "NAME_TAKEN" || r.code === "VALIDATION") setNameError(true);
      else notify.error(r.code);
    } catch {
      notify.error("NETWORK", () => save(asNew));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!savedId) return;
    setSaving(true);
    try {
      const r = await deleteCustomList(savedId);
      if (r.ok) {
        notify.success("Lista excluída");
        reset();
      } else notify.error(r.code);
    } catch {
      notify.error("NETWORK", remove);
    } finally {
      setSaving(false);
    }
  }

  const weeks = config.period.kind === "weeks" ? monthWeeks(first) : [];
  const monthDays = config.period.kind === "days" ? monthDates(first) : [];
  const lead = monthDays.length ? new Date(`${monthDays[0]}T12:00:00Z`).getUTCDay() : 0;
  const picked = config.period.kind === "days" ? config.period.dates : [];
  const empty =
    (config.period.kind === "weeks" && config.period.weeks.length === 0) ||
    (config.period.kind === "days" && config.period.dates.length === 0);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpened(true);
          ref.current?.showModal();
        }}
        className="btn-glass flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 font-bold"
      >
        <Icon name="calendar" size={20} />
        Lista personalizada
        {saved.length ? (
          <span className="text-sm text-muted">
            · {saved.length} salva{saved.length > 1 ? "s" : ""}
          </span>
        ) : null}
      </button>
      <dialog
        ref={ref}
        aria-label="Lista personalizada de vagas"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="notif-dialog"
      >
        <div className="status-fill" aria-hidden="true" />
        {opened ? (
          <div
            className="notif-panel grid max-h-[min(90dvh,820px)] w-[min(94vw,420px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Lista personalizada</h2>
                <p className="text-sm font-semibold text-muted">Escolha o período e filtre as vagas livres.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="-mx-1 grid content-start gap-3 overflow-y-auto overscroll-contain px-1 pb-1">
              <Part icon="sparkles" tint="lavender" title="Minhas listas">
                {saved.length ? (
                  <ul className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-0.5" aria-label="Listas salvas">
                    {saved.map((l) => (
                      <li key={l.id} className="shrink-0">
                        <Chip on={l.id === savedId} onClick={() => load(l)}>
                          {l.name}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-semibold text-muted">
                    Monte os filtros abaixo e salve para usar de novo em um toque.
                  </p>
                )}
                {active ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="flex min-h-11 items-center gap-1 justify-self-start rounded-full px-2 text-sm font-bold text-primary-text"
                  >
                    <Icon name="plus" size={16} />
                    Nova lista
                  </button>
                ) : null}
              </Part>

              {services.length > 1 ? (
                <Part icon="scissors" tint="pink" title="Serviço">
                  <ul className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-0.5" aria-label="Serviço">
                    {services.map((s) => (
                      <li key={s.id} className="shrink-0">
                        <Chip
                          on={(config.serviceId ?? services[0].id) === s.id}
                          onClick={() => set({ serviceId: s.id })}
                        >
                          {s.name}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </Part>
              ) : null}

              <Part icon="calendar" tint="blue" title="Período">
                <div
                  role="group"
                  aria-label="Tipo de período"
                  className="grid grid-cols-3 gap-1 rounded-full bg-white/60 p-1"
                >
                  {KINDS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={config.period.kind === value}
                      onClick={() => setKind(value)}
                      className={`min-h-11 rounded-full px-2 text-sm font-bold ${config.period.kind === value ? "btn-tint" : "text-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ul className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-0.5" aria-label="Mês">
                  {MONTH_CHOICES.map((o) => (
                    <li key={o} className="shrink-0">
                      <Chip on={monthOffset === o} onClick={() => pickMonth(o)}>
                        {monthName(monthStart(today, o))}
                      </Chip>
                    </li>
                  ))}
                </ul>
                {config.period.kind === "weeks" ? (
                  <ul className="grid gap-2" aria-label="Semanas do mês">
                    {weeks.map((w, i) => {
                      const past = w[w.length - 1] < today;
                      const sel = config.period.kind === "weeks" && config.period.weeks.includes(i + 1);
                      return (
                        <li key={w[0]}>
                          <Chip
                            on={sel}
                            disabled={past}
                            onClick={() =>
                              config.period.kind === "weeks" &&
                              set({ period: { ...config.period, weeks: toggle(config.period.weeks, i + 1).sort() } })
                            }
                          >
                            {i + 1}ª semana · {dm(w[0])} a {dm(w[w.length - 1])}
                          </Chip>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {config.period.kind === "days" ? (
                  <div>
                    <div
                      className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-bold text-muted"
                      aria-hidden="true"
                    >
                      {WEEKDAYS.map((w) => (
                        <span key={w}>{w.slice(0, 1)}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: lead }, (_, i) => (
                        <span key={`b${i}`} />
                      ))}
                      {monthDays.map((d) => {
                        const on = picked.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled={d < today}
                            aria-pressed={on}
                            aria-label={`${dm(d)}`}
                            onClick={() => set({ period: { kind: "days", dates: toggle(picked, d).sort() } })}
                            className={`grid min-h-11 place-content-center rounded-full text-sm font-bold disabled:opacity-30 ${on ? "btn-tint" : "btn-glass"}`}
                          >
                            {Number(d.slice(8))}
                          </button>
                        );
                      })}
                    </div>
                    {picked.length ? (
                      <button
                        type="button"
                        onClick={() => set({ period: { kind: "days", dates: [] } })}
                        className="mt-1 min-h-11 rounded-full px-2 text-sm font-bold text-primary-text"
                      >
                        Limpar {picked.length} dia{picked.length > 1 ? "s" : ""}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </Part>

              <Part
                icon="clock"
                tint="orange"
                title="Filtros"
                action={
                  config.weekdays.length || config.shifts.length ? (
                    <button
                      type="button"
                      onClick={() => set({ weekdays: [], shifts: [] })}
                      className="flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-primary-text"
                    >
                      <Icon name="refresh" size={16} />
                      Limpar
                    </button>
                  ) : null
                }
              >
                <p className="text-xs font-bold text-muted">Dias da semana · nenhum marcado = todos</p>
                <ul className="flex flex-wrap gap-2" aria-label="Dias da semana">
                  {WEEKDAYS.map((w, i) => (
                    <li key={w}>
                      <Chip
                        on={config.weekdays.includes(i)}
                        onClick={() => set({ weekdays: toggle(config.weekdays, i).sort() })}
                      >
                        {w}
                      </Chip>
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-bold text-muted">Turno · nenhum marcado = o dia todo</p>
                <ul className="flex flex-wrap gap-2" aria-label="Turno">
                  {SHIFTS.map((s) => (
                    <li key={s.value}>
                      <Chip
                        on={config.shifts.includes(s.value)}
                        onClick={() => set({ shifts: toggle<Shift>(config.shifts, s.value) })}
                      >
                        {s.label}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </Part>

              <Part
                icon="chat"
                tint="green"
                title={
                  loading
                    ? "Buscando vagas…"
                    : `${days.length} dia${days.length === 1 ? "" : "s"} · ${total} horário${total === 1 ? "" : "s"}`
                }
              >
                {loading ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-muted" role="status">
                    <span className="spin" aria-hidden="true" /> Conferindo a agenda…
                  </p>
                ) : current?.error ? (
                  <div className="flex items-center justify-between gap-2" role="alert">
                    <p className="text-sm font-semibold text-fail">{messageFor(current.error)}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRes(null);
                        setRetry((n) => n + 1);
                      }}
                      className="btn-glass min-h-11 shrink-0 rounded-full px-4 text-sm font-bold"
                    >
                      Tentar de novo
                    </button>
                  </div>
                ) : empty ? (
                  <p className="text-sm font-semibold text-muted">
                    {config.period.kind === "weeks"
                      ? "Marque pelo menos uma semana."
                      : "Toque nos dias que quer divulgar."}
                  </p>
                ) : days.length === 0 ? (
                  <p className="text-sm font-semibold text-muted">
                    Nenhuma vaga com esses filtros. Tente outro turno, dia ou período.
                  </p>
                ) : (
                  <ul
                    className="grid max-h-56 gap-1.5 overflow-y-auto overscroll-contain"
                    aria-label="Vagas encontradas"
                  >
                    {days.map((d) => (
                      <li key={d.date} className="text-sm leading-snug">
                        <span className="font-bold capitalize">{d.label}</span>{" "}
                        <span className="font-semibold text-muted">{toRanges(d.slots).join(" · ")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Part>

              <Part icon="bell" tint="lavender" title={active ? "Esta lista" : "Salvar esta lista"}>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(false);
                  }}
                  maxLength={40}
                  aria-label="Nome da lista"
                  aria-invalid={nameError}
                  placeholder="Ex.: Mês todo, só manhãs"
                  className="min-h-12 w-full rounded-xl border px-3.5 text-base font-semibold"
                />
                {nameError ? (
                  <p className="text-xs font-bold text-fail" role="alert">
                    {name.trim() ? "Já existe uma lista com esse nome." : "Dê um nome para salvar."}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    aria-busy={saving}
                    onClick={() => save(false)}
                    className="btn-tint flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold disabled:opacity-60"
                  >
                    {saving ? <span className="spin" aria-hidden="true" /> : null}
                    {active ? "Atualizar" : "Salvar lista"}
                  </button>
                  {active ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => save(true)}
                      className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60"
                    >
                      Salvar como nova
                    </button>
                  ) : null}
                  {active && !confirmDelete ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setConfirmDelete(true)}
                      className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold text-fail disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
                {active && confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2" role="alert">
                    <p className="text-sm font-bold">Excluir &ldquo;{active.name}&rdquo;?</p>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={remove}
                      className="btn-tint min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60"
                    >
                      Sim, excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : null}
              </Part>
            </div>

            <button
              type="button"
              onClick={() => setSharing((n) => (n ?? 0) + 1)}
              disabled={loading || total === 0}
              className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
            >
              <Icon name="message" size={20} />
              Gerar texto
            </button>
          </div>
        ) : null}
      </dialog>
      {sharing !== null && current?.data ? (
        <ShareSheet
          key={sharing}
          defaultOpen
          serviceName={current.data.serviceName}
          days={days}
          onClose={() => setSharing(null)}
        />
      ) : null}
    </>
  );
}
