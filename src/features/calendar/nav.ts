"use client";

import { createContext, useContext } from "react";

export type CalendarNav = {
  /** Volta do dia para o mês com zoom de saída até a célula do dia. */
  toMonth: (month: string, fromDay?: string) => void;
};

export const CalendarNavContext = createContext<CalendarNav | null>(null);

/** Navegação da casca do Calendário; null fora dele (no Painel a faixa segue com links normais). */
export const useCalendarNav = () => useContext(CalendarNavContext);
