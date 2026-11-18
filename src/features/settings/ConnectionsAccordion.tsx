"use client";

import { useRef, useState } from "react";
import { IconTile } from "@/components/ui/Icon";
import { connectionsSummary } from "./connection-status";
import { SECTIONS, type SectionKey } from "./sections";
import { StatusBadge } from "./StatusBadge";
import type { SettingsLine } from "./summary";
import { useLiveLines } from "./use-live-lines";

/**
 * Conexões em acordeão: cada linha mostra o selo de estado e, ao tocar, abre ali mesmo o cartão de conectar
 * (sem trocar de página). Um aberto por vez. O cartão só monta na primeira abertura, então nada consulta o
 * WhatsApp nem o aparelho antes de a dona pedir. As telas de cada seção continuam existindo para links diretos.
 */
export function ConnectionsAccordion({
  title,
  lines: serverLines,
  bodies,
}: {
  title: string;
  lines: SettingsLine[];
  bodies: Partial<Record<SectionKey, React.ReactNode>>;
}) {
  const lines = useLiveLines(serverLines);
  const [open, setOpen] = useState<SectionKey | null>(null);
  const [mounted, setMounted] = useState<ReadonlySet<SectionKey>>(new Set());
  const items = useRef(new Map<SectionKey, HTMLLIElement>());
  const { active, total, attention } = connectionsSummary(lines.map((l) => l.badge));

  function toggle(key: SectionKey) {
    const next = open === key ? null : key;
    setOpen(next);
    if (!next) return;
    setMounted((m) => (m.has(next) ? m : new Set(m).add(next)));
    // Depois da animação, traz o cartão aberto para a tela (no celular ele pode abrir abaixo da dobra)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => items.current.get(next)?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }),
      reduce ? 0 : 320,
    );
  }

  return (
    <section aria-label={title} className="mt-7 grid gap-2 first:mt-0">
      <div className="flex items-baseline justify-between gap-3 px-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
        <p className="text-xs font-bold text-muted" aria-live="polite">
          {active} de {total} ativas
          {attention ? (
            <span className="text-wait"> · {attention === 1 ? "1 pede atenção" : `${attention} pedem atenção`}</span>
          ) : null}
        </p>
      </div>
      <ul className="glass divide-y divide-line overflow-hidden rounded-[1.4rem]">
        {lines.map((l) => {
          const s = SECTIONS[l.section];
          const isOpen = open === l.section;
          const panel = `conexao-${l.section}`;
          return (
            <li
              key={l.section}
              ref={(el) => {
                if (el) items.current.set(l.section, el);
                else items.current.delete(l.section);
              }}
              className="scroll-mb-28 scroll-mt-4"
            >
              <h3>
                <button
                  type="button"
                  id={`ajuste-${l.section}`}
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => toggle(l.section)}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-soft md:hover:bg-soft/50"
                >
                  <IconTile name={s.icon} tint={s.tint} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold leading-tight">{s.title}</span>
                    <span className="block truncate text-sm font-semibold text-muted">{l.status || "\u00a0"}</span>
                  </span>
                  {l.badge ? <StatusBadge badge={l.badge} /> : null}
                  <svg
                    viewBox="0 0 24 24"
                    className={`size-4 shrink-0 text-muted transition-transform duration-300 ease-out motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </h3>
              <div
                id={panel}
                role="region"
                aria-labelledby={`ajuste-${l.section}`}
                inert={!isOpen}
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="min-h-0 overflow-hidden">
                  {mounted.has(l.section) ? (
                    <div className="conexao-corpo grid gap-3 px-3 pb-3">{bodies[l.section]}</div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
