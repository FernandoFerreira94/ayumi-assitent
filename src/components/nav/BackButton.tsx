"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Quantas telas a pessoa já abriu dentro do app nesta aba (fica na memória: some no reload, como o histórico do app). */
let inAppNavs = 0;

/** Conta as trocas de tela; montado uma vez no layout do app. */
export function NavHistory() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else inAppNavs++;
  }, [pathname]);
  return null;
}

/**
 * Seta de voltar das telas secundárias: volta para onde a pessoa estava, como no iPhone.
 * No PWA aberto direto na tela (sem histórico do app) cai em `fallback` (a agenda, ou a tela-mãe da seção).
 */
export function BackButton({ fallback = "/agenda" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <a
      href={fallback}
      aria-label="Voltar"
      className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
      onClick={(e) => {
        e.preventDefault();
        if (inAppNavs > 0) router.back();
        else router.push(fallback);
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[22px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </a>
  );
}
