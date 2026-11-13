"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { maskMoney } from "@/lib/money";
import { saveService } from "./actions";
import { BUFFER_OPTIONS, formatDuration, nameTaken, SERVICE_COLORS, type CatalogService } from "./catalog";

const label = "grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted";
const field =
  "min-h-12 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold normal-case tracking-normal text-fg outline-none focus:border-primary aria-invalid:border-fail";
const pill = "min-h-11 rounded-full border border-line bg-surface px-3.5 text-sm font-bold normal-case tracking-normal";
const pressed = "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

type Draft = Omit<CatalogService, "id" | "upcoming" | "priceCents"> & { price: string };

const blank = (preset: Partial<Draft>): Draft => ({
  name: "",
  durationMin: 60,
  price: "",
  priceFrom: false,
  bufferMin: 0,
  color: "lav",
  notes: null,
  bookable: true,
  showInSlots: true,
  ...preset,
});

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/**
 * Cria (sem `service`) ou edita um serviço. Valida antes de enviar o que dá para saber aqui
 * (nome vazio ou repetido, preço vazio); o servidor confere de novo.
 */
export function ServiceForm({
  service,
  preset = {},
  services,
  onSaved,
  onDuplicate,
  onDelete,
}: {
  service?: CatalogService;
  preset?: Partial<Draft>;
  services: Pick<CatalogService, "id" | "name">[];
  onSaved: () => void;
  onDuplicate: (s: CatalogService) => void;
  onDelete: (s: CatalogService) => void;
}) {
  const [d, setD] = useState<Draft>(() =>
    service ? { ...service, price: maskMoney(String(service.priceCents)) } : blank(preset),
  );
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const [local, setLocal] = useState<{ field: string; text: string } | null>(null);
  const [askDelete, setAskDelete] = useState(false);

  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveService(prev, fd);
    if (res.ok) {
      const changed =
        service && (service.durationMin !== d.durationMin || maskMoney(String(service.priceCents)) !== d.price);
      if (service) notify.success("Salvo", changed ? "Vale para os próximos agendamentos" : undefined);
      else notify.success("Serviço criado", `${d.name.trim()} · ${formatDuration(d.durationMin)} · R$ ${d.price}`);
      onSaved();
    } else if (res.code !== "VALIDATION" && res.code !== "NAME_TAKEN") notify.error(res.code);
    return res;
  }, null);

  const serverField = state && !state.ok ? state.field : undefined;
  const errorFor = (f: string) => {
    if (local?.field === f) return local.text;
    if (serverField !== f) return null;
    if (state && !state.ok && state.code === "NAME_TAKEN") return `Já existe "${d.name.trim()}" na lista.`;
    return f === "price" ? "Digite o preço. Use 0 se for cortesia." : "Confira este campo.";
  };

  function check(e: React.FormEvent<HTMLFormElement>) {
    const name = d.name.trim();
    const err =
      name.length < 2
        ? { field: "name", text: "Dê um nome ao serviço." }
        : nameTaken(services, name, service?.id)
          ? { field: "name", text: `Já existe "${name}" na lista.` }
          : !d.price.trim()
            ? { field: "price", text: "Digite o preço. Use 0 se for cortesia." }
            : null;
    setLocal(err);
    if (err) {
      e.preventDefault();
      e.currentTarget.querySelector<HTMLElement>(`[name="${err.field}"]`)?.focus();
    }
  }

  const end = 14 * 60 + d.durationMin;
  const nameError = errorFor("name");
  const priceError = errorFor("price");

  return (
    <form action={action} onSubmit={check} noValidate className="grid gap-4">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <input type="hidden" name="durationMin" value={d.durationMin} />
      <input type="hidden" name="bufferMin" value={d.bufferMin} />
      <input type="hidden" name="color" value={d.color} />
      {(["priceFrom", "bookable", "showInSlots"] as const).map((k) =>
        d[k] ? <input key={k} type="hidden" name={k} value="on" /> : null,
      )}

      <label className={label}>
        Nome
        <input
          name="name"
          autoComplete="off"
          placeholder="Ex.: Escova modelada"
          value={d.name}
          onChange={(e) => set("name", e.target.value)}
          className={field}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "svc-name-err" : undefined}
        />
        {nameError ? (
          <span id="svc-name-err" role="alert" className="text-xs font-semibold normal-case tracking-normal text-fail">
            {nameError}
          </span>
        ) : null}
      </label>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className={`${label} min-w-0`}>
          <span id="svc-dur">Duração</span>
          <div
            role="group"
            aria-labelledby="svc-dur"
            className="flex min-h-12 items-center gap-1 rounded-full border-[1.5px] border-line bg-surface p-1"
          >
            <button
              type="button"
              aria-label="Diminuir 15 minutos"
              disabled={d.durationMin <= 15}
              onClick={() => set("durationMin", Math.max(15, d.durationMin - 15))}
              className="grid size-11 place-items-center rounded-full bg-soft text-xl font-bold text-primary-text disabled:opacity-40"
            >
              −
            </button>
            <output
              aria-live="polite"
              className="flex-1 text-center text-[15px] font-bold normal-case tracking-normal text-fg tabular-nums"
            >
              {formatDuration(d.durationMin)}
            </output>
            <button
              type="button"
              aria-label="Aumentar 15 minutos"
              disabled={d.durationMin >= 480}
              onClick={() => set("durationMin", Math.min(480, d.durationMin + 15))}
              className="grid size-11 place-items-center rounded-full bg-soft text-xl font-bold text-primary-text disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <label className={`${label} min-w-0`}>
          Preço
          <span className="flex min-h-12 min-w-0 items-center rounded-2xl border-[1.5px] border-line bg-surface pl-3.5 text-base font-semibold normal-case tracking-normal text-fg focus-within:border-primary has-aria-invalid:border-fail">
            R$
            <input
              name="price"
              inputMode="numeric"
              placeholder="0,00"
              value={d.price}
              onChange={(e) => set("price", maskMoney(e.target.value))}
              className="h-12 min-w-0 flex-1 bg-transparent px-2 outline-none"
              aria-invalid={!!priceError}
              aria-describedby={priceError ? "svc-price-err" : undefined}
            />
          </span>
          {priceError ? (
            <span
              id="svc-price-err"
              role="alert"
              className="text-xs font-semibold normal-case tracking-normal text-fail"
            >
              {priceError}
            </span>
          ) : null}
        </label>
      </div>

      <Toggle
        label='Preço "a partir de"'
        hint="Para serviços que variam com o cabelo"
        on={d.priceFrom}
        onChange={(v) => set("priceFrom", v)}
      />

      <div className={label}>
        <span id="svc-buf">Intervalo depois</span>
        <div role="group" aria-labelledby="svc-buf" className="flex flex-wrap gap-1.5">
          {BUFFER_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={d.bufferMin === m}
              onClick={() => set("bufferMin", m)}
              className={`${pill} ${pressed}`}
            >
              {m ? `${m} min` : "Sem"}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold normal-case tracking-normal">
          O calendário bloqueia esse tempo para limpar e preparar.
        </span>
      </div>

      <div className={label}>
        <span id="svc-color">Cor no calendário</span>
        <div role="group" aria-labelledby="svc-color" className="flex flex-wrap gap-2">
          {Object.entries(SERVICE_COLORS).map(([k, name]) => (
            <button
              key={k}
              type="button"
              aria-pressed={d.color === k}
              aria-label={name}
              onClick={() => set("color", k)}
              style={{
                background: `var(--svc-${k})`,
                boxShadow: d.color === k ? `0 0 0 2.5px var(--svc-${k})` : "0 0 0 1px var(--line)",
              }}
              className="h-11 w-11 rounded-full border-[3px] border-surface"
            />
          ))}
        </div>
        <div className="flex items-center gap-2 normal-case tracking-normal">
          <span className="font-semibold">Prévia</span>
          <div
            className="flex flex-1 flex-col rounded-xl px-3 py-1.5 text-xs font-semibold"
            style={{
              background: `var(--svc-${d.color}-soft)`,
              color: `var(--svc-${d.color}-ink)`,
              boxShadow: `inset 3px 0 0 var(--svc-${d.color})`,
            }}
          >
            <b className="text-[13px]">Ana Souza</b>
            {d.name.trim() || "Serviço"} · 14:00 – {hhmm(end)}
            {d.bufferMin ? ` (+${d.bufferMin} min)` : ""}
          </div>
        </div>
      </div>

      <label className={label}>
        Observação interna
        <textarea
          name="notes"
          rows={2}
          maxLength={300}
          placeholder="Ex.: pedir para vir com o cabelo seco"
          value={d.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          className={`${field} resize-none py-3`}
        />
      </label>

      <div>
        <Toggle
          label="Disponível para agendar"
          hint="Pausado não aparece no novo agendamento"
          on={d.bookable}
          onChange={(v) => set("bookable", v)}
        />
        <Toggle
          label="Mostrar nas vagas"
          hint="Aparece na mensagem de horários livres"
          on={d.showInSlots}
          onChange={(v) => set("showInSlots", v)}
        />
      </div>

      <SubmitButton pendingLabel="Salvando…" className="rounded-full">
        {service ? "Salvar" : "Criar serviço"}
      </SubmitButton>

      {service ? (
        <div className="-mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(service)}
            className="btn-glass min-h-12 rounded-full text-sm font-bold"
          >
            Duplicar
          </button>
          <button
            type="button"
            onClick={() => (askDelete ? onDelete(service) : setAskDelete(true))}
            className="btn-glass min-h-12 rounded-full px-3 text-sm font-bold text-fail"
          >
            {!askDelete
              ? "Excluir"
              : service.upcoming
                ? `Excluir? ${service.upcoming} ${service.upcoming === 1 ? "atendimento continua" : "atendimentos continuam"}`
                : "Toque de novo para excluir"}
          </button>
        </div>
      ) : null}
    </form>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5">
      <span className="text-sm font-bold">
        {label}
        <small className="block text-xs font-semibold text-muted">{hint}</small>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className="relative h-8 w-13 shrink-0 rounded-full bg-[#dcd7ea] transition-colors aria-checked:bg-ok after:absolute after:left-[3px] after:top-[3px] after:h-[26px] after:w-[26px] after:rounded-full after:bg-white after:shadow after:transition-transform aria-checked:after:translate-x-5"
      />
    </div>
  );
}
