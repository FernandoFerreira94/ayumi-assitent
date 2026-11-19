"use client";

import { useState } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { saveWorkingHours } from "@/features/hours/actions";
import type { Day } from "@/features/hours/slots";
import { HOUR_OPTIONS } from "@/features/hours/times";
import { describeHours, draftFromWeek, draftToFormData, draftToWeek, type HoursDraft } from "./hours";
import { EntryScreen, Fine, LinkButton, PrimaryButton } from "./EntryScreen";

const NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
/** Segunda primeiro, como se lê a semana. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
// 16px: abaixo disso o iPhone dá zoom na tela ao tocar no campo
const sel = "min-h-11 rounded-full border border-line bg-surface px-3 text-base font-bold disabled:opacity-50";

function TimeSelect({
  value,
  label,
  onChange,
  disabled,
}: {
  value: string;
  label: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={sel}
    >
      {HOUR_OPTIONS.map((t) => (
        <option key={t}>{t}</option>
      ))}
    </select>
  );
}

/**
 * Entrada › Horários: "Quando você atende?". Já vem com o mais comum marcado; salva pela mesma ação de
 * Ajustes › Expediente. Único passo sem "Pular": as vagas e a agenda dependem dele.
 */
export function EntryHours({ initial, onSaved }: { initial: Day[]; onSaved: (week: Day[]) => void }) {
  const [draft, setDraft] = useState<HoursDraft>(() => draftFromWeek(initial));
  const [perDay, setPerDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bad, setBad] = useState<string | null>(null);

  const firstOpen = draft.days.find((d) => d.open) ?? draft.days[1];

  /** No modo "mesmo horário" abrir/fechar vale para todos os dias; por dia, só para o dia mexido. */
  function setTime(field: "opens" | "closes", value: string, day?: number) {
    setBad(null);
    setDraft((d) => ({
      ...d,
      days: d.days.map((x, i) => (day === undefined || i === day ? { ...x, [field]: value } : x)),
    }));
  }
  function toggleDay(i: number) {
    setBad(null);
    setDraft((d) => ({
      ...d,
      days: d.days.map((x, j) =>
        j === i
          ? {
              ...x,
              open: !x.open,
              opens: x.open ? x.opens : firstOpen.opens,
              closes: x.open ? x.closes : firstOpen.closes,
            }
          : x,
      ),
    }));
  }
  function backToSame() {
    setDraft((d) => ({ ...d, days: d.days.map((x) => ({ ...x, opens: firstOpen.opens, closes: firstOpen.closes })) }));
    setPerDay(false);
  }

  async function save() {
    setSaving(true);
    setBad(null);
    const res = await saveWorkingHours(null, draftToFormData(draft)).catch(() => null);
    setSaving(false);
    if (!res) return notify.error("NETWORK");
    if (res.ok) return onSaved(draftToWeek(draft));
    if (res.code === "VALIDATION")
      return setBad(
        res.field === "break"
          ? "A pausa precisa terminar depois de começar."
          : `${NAMES[Number(res.field)] ?? "O dia"}: o fechamento precisa ser depois da abertura.`,
      );
    notify.error(res.code);
  }

  const open = draft.days.some((d) => d.open);

  return (
    <EntryScreen
      step="hours"
      title="Quando você atende?"
      text="A agenda só oferece vagas nesses horários. Já deixamos o mais comum marcado: é só ajustar."
      actions={
        <>
          <PrimaryButton onClick={() => void save()} busy={saving} disabled={!open}>
            <Icon name="clock" size={22} />
            {saving ? "Salvando…" : "Salvar horários"}
          </PrimaryButton>
          <Fine>Você muda quando quiser em Ajustes › Expediente.</Fine>
        </>
      }
    >
      <div className="glass grid w-full gap-4 rounded-[1.75rem] p-5">
        <fieldset className="grid gap-2">
          <legend className="text-xs font-bold text-muted">Dias de atendimento</legend>
          <div className="flex justify-between gap-1">
            {WEEK_ORDER.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={draft.days[i].open}
                aria-label={NAMES[i]}
                onClick={() => toggleDay(i)}
                className={`grid size-11 place-content-center rounded-full text-sm font-bold ${
                  draft.days[i].open ? "btn-tint" : "btn-glass"
                }`}
              >
                {LETTERS[i]}
              </button>
            ))}
          </div>
        </fieldset>

        {perDay ? (
          <ul className="grid gap-2">
            {WEEK_ORDER.map((i) => {
              const d = draft.days[i];
              return (
                <li key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                  <span className={`text-sm font-bold ${d.open ? "" : "text-muted"}`}>{NAMES[i]}</span>
                  {d.open ? (
                    <>
                      <TimeSelect
                        label={`${NAMES[i]}: abre`}
                        value={d.opens}
                        onChange={(v) => setTime("opens", v, i)}
                      />
                      <TimeSelect
                        label={`${NAMES[i]}: fecha`}
                        value={d.closes}
                        onChange={(v) => setTime("closes", v, i)}
                      />
                    </>
                  ) : (
                    <span className="col-span-2 text-right text-sm font-semibold text-muted">Fechado</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2 text-sm font-bold">
              Abre
              <TimeSelect label="Abre" value={firstOpen.opens} onChange={(v) => setTime("opens", v)} />
            </div>
            <div className="flex items-center justify-between gap-2 text-sm font-bold">
              Fecha
              <TimeSelect label="Fecha" value={firstOpen.closes} onChange={(v) => setTime("closes", v)} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-sm font-bold">
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={draft.breakOn}
              onChange={(e) => setDraft((d) => ({ ...d, breakOn: e.target.checked }))}
              className="check-round"
            />
            Pausa do almoço
          </label>
          <span className="flex items-center gap-1.5">
            <TimeSelect
              label="Pausa: começa"
              value={draft.breakStart}
              disabled={!draft.breakOn}
              onChange={(v) => setDraft((d) => ({ ...d, breakStart: v }))}
            />
            às
            <TimeSelect
              label="Pausa: termina"
              value={draft.breakEnd}
              disabled={!draft.breakOn}
              onChange={(v) => setDraft((d) => ({ ...d, breakEnd: v }))}
            />
          </span>
        </div>

        <p className="rounded-[1.25rem] bg-soft px-4 py-2.5 text-center text-sm font-bold text-primary-text">
          {describeHours(draftToWeek(draft))}
        </p>
        {bad ? (
          <p role="alert" className="text-center text-sm font-semibold text-fail">
            {bad}
          </p>
        ) : null}
        <div className="flex justify-center">
          {perDay ? (
            <LinkButton onClick={backToSame}>Voltar para o mesmo horário</LinkButton>
          ) : (
            <LinkButton onClick={() => setPerDay(true)}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="plus" size={16} /> Um dia com outro horário
              </span>
            </LinkButton>
          )}
        </div>
      </div>
    </EntryScreen>
  );
}
