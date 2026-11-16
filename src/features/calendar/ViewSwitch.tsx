import Link from "next/link";

type Kind = "day" | "week" | "month";

const ITEMS: { kind: Kind; label: string; key: string }[] = [
  { kind: "day", label: "Dia", key: "D" },
  { kind: "week", label: "Semana", key: "S" },
  { kind: "month", label: "Mês", key: "M" },
];

const hrefFor = (kind: Kind, date: string) =>
  kind === "day"
    ? `/calendario?d=${date}`
    : kind === "week"
      ? `/calendario?v=semana&d=${date}`
      : `/calendario?v=mes&m=${date.slice(0, 7)}`;

/**
 * Seletor Dia / Semana / Mês do Calendário, só no desktop: a Semana precisa de largura (7 colunas),
 * então abaixo de lg o seletor some e o celular segue com o zoom entre mês e dia.
 */
export function ViewSwitch({ current, date }: { current: Kind; date: string }) {
  return (
    <nav aria-label="Visão do calendário" className="btn-glass hidden items-center rounded-full p-1 lg:flex">
      {ITEMS.map((it) => (
        <Link
          key={it.kind}
          href={hrefFor(it.kind, date)}
          scroll={false}
          aria-current={it.kind === current ? "page" : undefined}
          aria-keyshortcuts={it.key}
          title={`${it.label} (${it.key})`}
          className={`flex min-h-9 items-center rounded-full px-4 text-[14px] font-bold ${
            it.kind === current ? "bg-primary text-on-primary" : "text-primary-text"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
