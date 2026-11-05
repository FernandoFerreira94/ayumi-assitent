"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingLabel: string;
  /** Use fora de <form> (ou com ação otimista) para controlar o estado à mão. */
  pending?: boolean;
  className?: string;
  slowAfterMs?: number;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function SubmitButton({ children, pendingLabel, pending, className = "", slowAfterMs = 8000, ...rest }: Props) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const id = setTimeout(() => setSlow(true), slowAfterMs);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [busy, slowAfterMs]);

  return (
    <div className="grid gap-1">
      <button
        {...rest}
        type={rest.type ?? "submit"}
        disabled={busy || rest.disabled}
        aria-busy={busy}
        className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-bold text-on-primary transition-transform active:scale-[0.97] disabled:opacity-70 ${className}`}
      >
        {busy ? <span className="spin" aria-hidden="true" /> : null}
        <span>{busy ? pendingLabel : children}</span>
      </button>
      <p role="status" className="min-h-4 text-center text-xs text-muted">
        {busy && slow ? "Está demorando mais que o normal…" : ""}
      </p>
    </div>
  );
}
