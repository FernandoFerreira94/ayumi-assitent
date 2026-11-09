"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer } from "vaul";
import { formatMonthYear } from "@/lib/dates";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Destino ao escolher um mês: o dia 1, ou hoje quando é o mês corrente (a agenda já abre nele). */
export function monthHref(year: number, month: number, today: string, base = "/calendario"): string {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  return first.slice(0, 7) === today.slice(0, 7) ? base : `${base}?d=${first}`;
}

const chevron = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

/** O nome do mês acima da faixa de dias abre esta folha para pular para outro mês. */
export function MonthPicker({ date, today, base = "/calendario" }: { date: string; today: string; base?: string }) {
  const [open, setOpen] = useState(false);
  const selYear = Number(date.slice(0, 4));
  const selMonth = Number(date.slice(5, 7));
  const [year, setYear] = useState(selYear);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setYear(selYear);
      }}
    >
      <Drawer.Trigger className="-ml-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-primary-text">
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
          <path d="M8 3v3.5M16 3v3.5M3.5 10h17" />
        </svg>
        {formatMonthYear(date)}
        <span className="sr-only">, trocar mês</span>
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 10l5 5 5-5" />
        </svg>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pb-1 text-xl font-bold">Escolher mês</Drawer.Title>
          <Drawer.Description className="sr-only">A agenda abre no primeiro dia do mês escolhido.</Drawer.Description>
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Ano anterior"
              className="btn-glass grid size-11 place-content-center rounded-full"
            >
              {chevron("M15 5l-7 7 7 7")}
            </button>
            <p className="text-lg font-bold tabular-nums" aria-live="polite">
              {year}
            </p>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Próximo ano"
              className="btn-glass grid size-11 place-content-center rounded-full"
            >
              {chevron("M9 5l7 7-7 7")}
            </button>
          </div>
          <ul className="grid grid-cols-3 gap-2 pb-2">
            {MONTHS.map((label, i) => {
              const month = i + 1;
              const current = year === selYear && month === selMonth;
              const isTodayMonth = `${year}-${String(month).padStart(2, "0")}` === today.slice(0, 7);
              return (
                <li key={label}>
                  <Link
                    href={monthHref(year, month, today, base)}
                    scroll={false}
                    onClick={() => setOpen(false)}
                    aria-label={`${NAMES[i]} de ${year}`}
                    aria-current={current ? "date" : undefined}
                    className={`flex min-h-12 items-center justify-center rounded-full text-base font-bold ${
                      current ? "bg-primary text-on-primary" : "btn-glass"
                    } ${isTodayMonth && !current ? "ring-2 ring-primary" : ""}`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
