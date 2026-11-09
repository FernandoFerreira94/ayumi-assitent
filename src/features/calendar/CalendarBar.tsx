import Link from "next/link";

const chev = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

/** Topo das visões de mês e ano: botão voltar em pílula, título grande e setas para o vizinho. */
export function CalendarBar({
  back,
  title,
  prev,
  next,
  titleTone,
}: {
  back?: { href: string; label: string };
  title: string;
  prev: { href: string; label: string };
  next: { href: string; label: string };
  titleTone?: "rose";
}) {
  return (
    <div className="mb-2">
      <div className="flex min-h-11 items-center justify-between gap-2">
        {back ? (
          <Link
            href={back.href}
            scroll={false}
            className="btn-glass flex min-h-11 items-center gap-1 rounded-full pl-3 pr-4 text-[15px] font-bold text-primary-text"
          >
            {chev("M15 5l-7 7 7 7")}
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        <div className="btn-glass flex items-center rounded-full">
          <Link
            href={prev.href}
            scroll={false}
            aria-label={prev.label}
            className="grid size-11 place-content-center text-primary-text"
          >
            {chev("M15 5l-7 7 7 7")}
          </Link>
          <Link
            href={next.href}
            scroll={false}
            aria-label={next.label}
            className="grid size-11 place-content-center text-primary-text"
          >
            {chev("M9 5l7 7-7 7")}
          </Link>
        </div>
      </div>
      <h2 className={`px-1 pt-2 text-[34px] font-bold leading-tight ${titleTone === "rose" ? "text-rose" : ""}`}>
        {title}
      </h2>
    </div>
  );
}

/** "Hoje" flutuante no canto, como no Calendário do iPhone. */
export function TodayFab({ href }: { href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className="btn-glass cal-fab flex min-h-11 items-center rounded-full px-5 text-[15px] font-bold text-primary-text"
    >
      Hoje
    </Link>
  );
}
