"use client";

import { useEffect, useId, useRef, useState } from "react";

type Option<T extends string> = readonly [T, string];

/**
 * Seleção múltipla em "select" arredondado: botão em pílula que abre uma lista de vidro com marcas.
 * Não usa o <select multiple> nativo (no iPhone vira uma roda feia). Os valores marcados vão no formulário
 * como campos ocultos com o mesmo `name`.
 */
export function MultiSelect<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
  placeholder = "Selecione",
  invalid,
}: {
  name: string;
  label: string;
  options: readonly Option<T>[];
  value: ReadonlySet<T>;
  onChange: (next: Set<T>) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const picked = options.filter(([id]) => value.has(id));
  const summary =
    picked.length === 0
      ? null
      : picked.length === 1
        ? picked[0][1]
        : `${picked[0][1].split(" (")[0]} +${picked.length - 1}`;

  const toggle = (id: T) => {
    const n = new Set(value);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange(n);
  };

  return (
    <div ref={root} className="relative grid gap-2">
      {picked.map(([id]) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        data-invalid={invalid || undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-13 w-full min-w-0 items-center justify-between gap-3 rounded-full border px-5 text-left text-base font-semibold"
        style={{
          background: "rgba(255,255,255,0.94)",
          borderColor: invalid ? "var(--fail)" : "color-mix(in srgb, var(--primary) 30%, #ddd7f5)",
          boxShadow: "inset 0 1px 2px rgba(40,24,110,.07), 0 2px 6px -2px rgba(40,24,110,.12)",
        }}
      >
        <span className={`truncate ${summary ? "" : "text-muted"}`}>{summary ?? placeholder}</span>
        <span className="flex shrink-0 items-center gap-2">
          {picked.length > 1 ? (
            <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary">
              {picked.length}
            </span>
          ) : null}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`text-primary-text transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          aria-multiselectable
          className="grid max-h-72 gap-1 overflow-y-auto overscroll-contain rounded-3xl border p-2"
          style={{
            background: "rgba(255,255,255,0.97)",
            borderColor: "color-mix(in srgb, var(--primary) 30%, #ddd7f5)",
            boxShadow: "0 12px 32px -8px rgba(40,24,110,.25)",
          }}
        >
          {options.map(([id, text]) => {
            const on = value.has(id);
            return (
              <li key={id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left text-sm font-bold ${
                    on ? "bg-soft text-primary-text" : "text-fg"
                  }`}
                >
                  <span>{text}</span>
                  <span
                    aria-hidden
                    className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                      on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-transparent"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
