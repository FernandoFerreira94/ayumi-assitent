"use client";

import { useEffect, useId, useState } from "react";
import { LetterPicker } from "@/components/ui/LetterPicker";
import { formatBRL } from "@/lib/dates";
import { formatDuration } from "@/features/services/catalog";
import type { ServiceOption } from "./options";
import { applyDiscount, parseDiscount, type DiscountKind } from "./pricing";

const MAX_SERVICES = 5;
const pill =
  "flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-bold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-primary";

/**
 * Serviços do agendamento (um ou mais, na ordem) e desconto em % ou R$, com o total e a duração
 * calculados na hora. Cada seletor manda um campo "serviceIds"; o desconto vai em discountKind/discountValue.
 */
export function BookingServices({
  services,
  defaultIds = [],
  discountError,
  onMinutes,
}: {
  services: ServiceOption[];
  defaultIds?: string[];
  discountError?: boolean;
  /** Duração somada dos serviços escolhidos, para a folha conferir o expediente. */
  onMinutes?: (minutes: number) => void;
}) {
  const uid = useId();
  // Uma chave por seletor (para tirar do meio sem embaralhar) e o serviço escolhido em cada um
  const [rows, setRows] = useState(() =>
    (defaultIds.length ? defaultIds : [""]).slice(0, MAX_SERVICES).map((id, i) => ({ key: i, id })),
  );
  const [nextKey, setNextKey] = useState(rows.length);
  const [kind, setKind] = useState<DiscountKind | "">("");
  const [raw, setRaw] = useState("");

  const picked = rows.map((r) => services.find((s) => s.id === r.id)).filter((s) => s !== undefined);
  const subtotal = picked.reduce((c, s) => c + s.priceCents, 0);
  const minutes = picked.reduce((m, s) => m + s.durationMin, 0);
  useEffect(() => onMinutes?.(minutes), [minutes, onMinutes]);
  const discount = parseDiscount(kind, raw);
  const { discountCents, totalCents } = applyDiscount(subtotal, discount === "invalid" ? null : discount);

  return (
    <>
      {rows.map((r, i) => (
        <LetterPicker
          key={r.key}
          name={i === 0 ? "serviceId" : `serviceId-${r.key}`}
          inputName="serviceIds"
          label={i === 0 ? "Serviço" : `Serviço ${i + 1}`}
          placeholder="Escolha o serviço…"
          options={services}
          defaultId={r.id || undefined}
          onChange={(id) => setRows((all) => all.map((x) => (x.key === r.key ? { ...x, id } : x)))}
          aside={
            i > 0 ? (
              <button
                type="button"
                onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))}
                className="min-h-11 px-2 text-sm font-bold text-muted"
                aria-label={`Tirar o ${i + 1}º`}
              >
                Tirar
              </button>
            ) : undefined
          }
        />
      ))}
      {rows.length < MAX_SERVICES ? (
        <button
          type="button"
          onClick={() => {
            setRows((all) => [...all, { key: nextKey, id: "" }]);
            setNextKey((k) => k + 1);
          }}
          // Sem "serviço" no nome: o seletor principal já se chama assim
          aria-label="Adicionar mais um"
          className="btn-glass flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-full px-4 text-sm font-bold text-primary-text"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Mais um
        </button>
      ) : null}

      <fieldset className="grid gap-2">
        <legend className="pb-1 text-sm font-bold">Desconto</legend>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["", "Sem"],
              ["pct", "%"],
              ["brl", "R$"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="discountKind"
                value={value}
                checked={kind === value}
                onChange={() => {
                  setKind(value);
                  setRaw("");
                }}
                className="peer sr-only"
              />
              <span className={pill}>{value ? label : "Sem desconto"}</span>
            </label>
          ))}
          {kind ? (
            <input
              name="discountValue"
              inputMode={kind === "pct" ? "numeric" : "decimal"}
              autoComplete="off"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={kind === "pct" ? "10" : "15,00"}
              aria-label={kind === "pct" ? "Desconto em porcentagem" : "Desconto em reais"}
              aria-invalid={discount === "invalid" || discountError || undefined}
              aria-describedby={`${uid}-total`}
              className="min-h-11 w-28 rounded-full border px-4 text-base font-semibold"
            />
          ) : null}
        </div>
        {discount === "invalid" || (discountError && kind) ? (
          <span role="alert" className="text-xs font-semibold text-fail">
            {kind === "pct" ? "Use um número de 1 a 100." : "Use um valor em reais, como 15 ou 15,50."}
          </span>
        ) : null}
      </fieldset>

      <label className="grid gap-1 text-sm font-bold">
        Observação <span className="font-semibold text-muted">(opcional)</span>
        <input
          name="notes"
          maxLength={300}
          autoComplete="off"
          placeholder="Ex.: desconto de aniversário"
          className="min-h-11 w-full rounded-full border px-4 text-base font-semibold"
        />
      </label>

      {picked.length ? (
        <p
          id={`${uid}-total`}
          className="glass flex items-baseline justify-between gap-3 rounded-2xl px-4 py-3"
          aria-live="polite"
        >
          <span className="text-sm font-semibold text-muted">
            {formatDuration(minutes)}
            {picked.length > 1 ? ` · ${picked.length} serviços` : ""}
          </span>
          <span className="text-right">
            {discountCents ? (
              <span className="block text-xs font-semibold text-muted">
                <s>{formatBRL(subtotal)}</s> · −{formatBRL(discountCents)}
              </span>
            ) : null}
            <b className="text-lg">Total {formatBRL(totalCents)}</b>
          </span>
        </p>
      ) : null}
    </>
  );
}
