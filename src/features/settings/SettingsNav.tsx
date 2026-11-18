"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconTile } from "@/components/ui/Icon";
import { SECTIONS } from "./sections";
import type { SettingsGroupData, SettingsLine } from "./summary";
import { useLiveLines } from "./use-live-lines";

/**
 * Desktop: as seções de Ajustes numa coluna à esquerda, como os Ajustes do Mac.
 * Trocar de seção troca só o lado direito. Em `/ajustes` a própria página já é a lista, então some.
 */
export function SettingsNav({ groups }: { groups: SettingsGroupData[] }) {
  const path = usePathname();
  // Notificação depende deste aparelho: resolve aqui, uma vez, para todas as linhas
  const live = useLiveLines(groups.flatMap((g) => g.lines));
  const bySection = new Map<string, SettingsLine>(live.map((l) => [l.section, l]));
  if (path === "/ajustes") return null;
  return (
    <nav
      aria-label="Seções de ajustes"
      className="sticky top-0 hidden max-h-dvh w-80 shrink-0 overflow-y-auto py-7 pl-8 lg:block"
    >
      <Link href="/ajustes" className="mb-4 block px-3 text-2xl font-bold">
        Ajustes
      </Link>
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title} className="mt-5 grid gap-1.5 first-of-type:mt-0">
          <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted">{g.title}</h2>
          <ul className="glass grid gap-0.5 rounded-[1.4rem] p-1.5">
            {g.lines.map((line) => {
              const l = bySection.get(line.section) ?? line;
              const s = SECTIONS[l.section];
              const current = path.startsWith(s.href);
              return (
                <li key={l.section}>
                  <Link
                    href={s.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-2.5 py-2 ${current ? "bg-soft" : "hover:bg-soft/60"}`}
                  >
                    <IconTile name={s.icon} tint={s.tint} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-bold leading-tight ${current ? "text-primary-text" : ""}`}
                      >
                        {s.title}
                      </span>
                      <span className="block truncate text-xs font-semibold text-muted">{l.status}</span>
                    </span>
                    {l.badge ? (
                      <span
                        data-tone={l.badge.tone}
                        title={l.badge.label}
                        className={`size-2 shrink-0 rounded-full ${l.badge.tone === "ok" ? "bg-ok" : l.badge.tone === "warn" ? "bg-wait" : "bg-muted/50"}`}
                      >
                        <span className="sr-only">{l.badge.label}</span>
                      </span>
                    ) : l.todo ? (
                      <span className="shrink-0 rounded-full bg-wait-bg px-2 py-0.5 text-[11px] font-bold text-wait">
                        {l.todo}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
