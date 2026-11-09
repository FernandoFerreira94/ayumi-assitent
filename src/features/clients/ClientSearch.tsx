"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/** Espera a pessoa parar de digitar antes de buscar. */
const DEBOUNCE_MS = 250;

/** Busca enquanto digita, sem Enter e sem recarregar: só troca o ?q= da URL. */
export function ClientSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function go(q: string) {
    clearTimeout(timer.current);
    const url = q.trim() ? `${pathname}?q=${encodeURIComponent(q.trim())}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  }

  return (
    <form
      role="search"
      className="relative pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
        // No iPhone, Buscar no teclado fecha o teclado
        (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      <input
        name="q"
        value={value}
        onChange={(e) => {
          const q = e.target.value;
          setValue(q);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => go(q), DEBOUNCE_MS);
        }}
        type="search"
        enterKeyHint="search"
        aria-label="Buscar cliente"
        aria-busy={pending}
        placeholder="Buscar por nome ou telefone"
        className="min-h-12 w-full rounded-full border px-4 pr-11 text-base font-semibold"
      />
      {pending ? <span className="spin absolute right-4 top-3.5" aria-hidden="true" /> : null}
    </form>
  );
}
