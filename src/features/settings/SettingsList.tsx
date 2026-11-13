import Link from "next/link";
import { IconTile } from "@/components/ui/Icon";
import { SECTIONS, type SectionKey } from "./sections";

/** Grupo da lista de Ajustes: título pequeno em cima e as linhas num cartão de vidro, como no iPhone. */
export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-7 grid gap-2 first:mt-0">
      <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      <ul className="glass divide-y divide-line overflow-hidden rounded-[1.4rem]">{children}</ul>
    </section>
  );
}

/**
 * Linha que abre uma seção. `status` resume o estado ("Conectado"); `todo` mostra o selo de pendência, para a
 * dona ver de longe o que ainda falta configurar. `id` é o alvo do tour.
 */
export function SettingsRow({
  section,
  status,
  todo,
}: {
  section: SectionKey;
  status: React.ReactNode;
  todo?: string;
}) {
  const s = SECTIONS[section];
  return (
    <li>
      <Link
        id={`ajuste-${section}`}
        href={s.href}
        className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-soft"
      >
        <IconTile name={s.icon} tint={s.tint} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold leading-tight">{s.title}</span>
          <span className="block truncate text-sm font-semibold text-muted">{status}</span>
        </span>
        {todo ? (
          <span className="shrink-0 rounded-full bg-wait-bg px-2.5 py-1 text-xs font-bold text-wait">{todo}</span>
        ) : null}
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </li>
  );
}
