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

/** Topo das visões de mês e ano: voltar em pílula (zoom de saída) e setas para o vizinho (deslizam). */
export function CalendarBar({
  back,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  loading,
}: {
  back?: { label: string; aria: string; onClick: () => void };
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="mb-1 flex min-h-11 items-center justify-between gap-2">
      {back ? (
        <button
          type="button"
          onClick={back.onClick}
          aria-label={back.aria}
          className="btn-glass flex min-h-11 items-center gap-1 rounded-full pl-3 pr-4 text-[15px] font-bold text-primary-text"
        >
          {chev("M15 5l-7 7 7 7")}
          {back.label}
        </button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        {loading ? <span className="spin" role="status" aria-label="Carregando atendimentos" /> : null}
        <div className="btn-glass flex items-center rounded-full">
          <button
            type="button"
            onClick={onPrev}
            aria-label={prevLabel}
            className="grid size-11 place-content-center text-primary-text"
          >
            {chev("M15 5l-7 7 7 7")}
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={nextLabel}
            className="grid size-11 place-content-center text-primary-text"
          >
            {chev("M9 5l7 7-7 7")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Hoje" flutuante no canto, como no Calendário do iPhone. */
export function TodayFab({ href, onClick }: { href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={
        onClick
          ? (e) => {
              e.preventDefault();
              onClick();
            }
          : undefined
      }
      className="btn-glass cal-fab flex min-h-11 items-center rounded-full px-5 text-[15px] font-bold text-primary-text"
    >
      Hoje
    </Link>
  );
}
