"use client";

import { useState } from "react";

/** Campo de texto das telas de entrar (16px+, sem zoom do iOS). */
export const LOGIN_INPUT =
  "min-h-13 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_4px_var(--soft)] focus:outline-none aria-invalid:border-fail";

export function passwordStrength(v: string) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  if (!v) return { pct: 0, label: "Força da senha", color: "var(--line)" };
  if (s >= 3) return { pct: s * 25, label: "Senha forte", color: "var(--ok)" };
  if (s === 2) return { pct: 50, label: "Senha razoável", color: "var(--wait)" };
  return { pct: 25, label: "Senha fraca", color: "var(--fail)" };
}

type Props = {
  id: string;
  label: string;
  autoComplete: string;
  placeholder: string;
  /** Mostra a barra de força (senha nova). */
  meter?: boolean;
  show: boolean;
  onToggle: () => void;
  /** A Bolha tapa os olhos com o foco na senha e espia quando ela está à mostra. */
  onFocusChange?: (focused: boolean) => void;
  invalid?: boolean | null;
};

/** Senha com botão de olho (mantém o foco no campo) e, na senha nova, a barra de força. */
export function PasswordInput({
  id,
  label,
  autoComplete,
  placeholder,
  meter,
  show,
  onToggle,
  onFocusChange,
  invalid,
}: Props) {
  const [strength, setStrength] = useState(() => passwordStrength(""));
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="pl-1.5 text-xs font-bold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={invalid ? true : undefined}
          className={`${LOGIN_INPUT} pr-12`}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onInput={meter ? (e) => setStrength(passwordStrength(e.currentTarget.value)) : undefined}
        />
        <button
          type="button"
          aria-label={show ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={show}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-muted"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {show ? <path d="M4 4l16 16" /> : null}
          </svg>
        </button>
      </div>
      {meter ? (
        <div className="flex items-center gap-2 pl-1.5 text-xs font-semibold text-muted">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <i
              className="block h-full rounded-full transition-all duration-300"
              style={{ width: `${strength.pct}%`, background: strength.color }}
            />
          </span>
          <span aria-live="polite">{strength.label}</span>
        </div>
      ) : null}
    </div>
  );
}
